/**
 * 
 * @interface QueryResult
 * @property {number} id 
 * @property {string} address 
 * @property {number} balance 
 * @property {'success' | 'error'} status 
 */
export interface QueryResult {
  id: number
  address: string
  balance: number
  status: "success" | "error"
}
