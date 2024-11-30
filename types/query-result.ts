/**
 * 查询结果的数据结构
 * @interface QueryResult
 * @property {number} id - 结果的唯一标识符
 * @property {string} address - Qubic 地址
 * @property {number} balance - 地址的余额
 * @property {'success' | 'error'} status - 查询状态，成功或失败
 */
export interface QueryResult {
  id: number
  address: string
  balance: number
  status: "success" | "error"
}
