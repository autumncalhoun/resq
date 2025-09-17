export interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    phone?: string
    user_type?: string
  }
}

export interface Profile {
  id: string
  email?: string
  full_name?: string
  phone?: string
  user_type?: string
}
