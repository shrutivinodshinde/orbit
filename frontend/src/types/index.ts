export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
    companyId: number;
    countryId: number | null;
    branchId: number | null;
  }
  
  export interface LoginResponse {
    accessToken: string;
    user: AuthUser;
  }
  
  export interface ApiError {
    message: string | string[];
    statusCode: number;
  }