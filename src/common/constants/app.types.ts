interface TUserProperties {
    userId: number;
    name: string;
    phone: string;
    email: string;
  }
  
  interface TRequestUser {
    user: TUserProperties;
  }
  
  export interface TokenInfo {
    userId: number;
    email: string;
  }
  
  export type TRequest = Request & TRequestUser;
  