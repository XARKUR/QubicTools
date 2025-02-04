"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
  CommandShortcut,
} from "@/components/ui/command"

const EXPLORER_BASE_URL = "https://explorer.qubic.org/network"

interface CommandSearchProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type SearchType = "tick" | "id" | "tx" | null

interface SearchResult {
  type: SearchType
  value: string
  formattedValue: string
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState("")
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange?.(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  // 检查搜索类型并格式化输入
  const processSearch = useCallback((input: string): SearchResult | null => {
    // 移除所有空格
    const cleanInput = input.trim()
    if (!cleanInput) return null

    console.log('Clean Input:', cleanInput)

    // 检查是否是 tick 数字
    if (/^\d{1,3}(,\d{3})*$|^\d+$/.test(cleanInput)) {
      const numericValue = cleanInput.replace(/,/g, '')
      const result: SearchResult = {
        type: "tick" as const,
        value: numericValue,
        formattedValue: Number(numericValue).toLocaleString()
      }
      console.log('Tick Result:', result)
      return result
    }

    // 检查是否是 60 位大写字母（ID）
    if (/^[A-Z]{60}$/.test(cleanInput)) {
      return {
        type: "id" as const,
        value: cleanInput,
        formattedValue: cleanInput
      }
    }

    // 检查是否是 60 位小写字母（交易）
    if (/^[a-z]{60}$/.test(cleanInput)) {
      return {
        type: "tx" as const,
        value: cleanInput,
        formattedValue: cleanInput
      }
    }

    console.log('No match found')
    return null
  }, [])

  // 当输入变化时更新搜索结果
  const handleInputChange = useCallback((value: string) => {
    console.log('Input: ', value)
    setSearchInput(value)
    const result = processSearch(value)
    console.log('Search Result:', result)
    setSearchResult(result)
  }, [processSearch])

  // 处理搜索结果的选择
  const handleSelect = useCallback((result: SearchResult) => {
    let url = EXPLORER_BASE_URL
    switch (result.type) {
      case "tick":
        url += `/tick/${result.value}`
        break
      case "id":
        url += `/address/${result.value}`
        break
      case "tx":
        url += `/tx/${result.value}`
        break
      default:
        return
    }
    window.open(url, '_blank')
    onOpenChange?.(false)
  }, [onOpenChange])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("common.search.title")}
      description={t("common.search.description")}
    >
      <CommandInput
        placeholder={t("common.search.placeholder")}
        value={searchInput}
        onValueChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            onOpenChange?.(false)
          }
        }}
      />
      <CommandList>
        {!searchInput && <CommandEmpty>{t("common.search.empty")}</CommandEmpty>}
        {searchResult && (
          <CommandGroup heading={t(`common.search.categories.${searchResult.type}`)}>
            <CommandItem
              onSelect={() => handleSelect(searchResult)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>{searchResult.formattedValue}</span>
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup heading={t("common.search.quickSearch.title")}>
          <CommandItem>
            <span>{t("common.search.quickSearch.tick")}</span>
            <CommandShortcut>18,888,888</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>{t("common.search.quickSearch.id")}</span>
            <CommandShortcut>QUBICABCDE...QRSTUVWXYZ</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>{t("common.search.quickSearch.tx")}</span>
            <CommandShortcut>abcdefghij...qrstuvwxyz</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
