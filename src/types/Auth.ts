/* Types */
type TAuthAccountType = 'user' | 'employee' | 'enterprise';

/* Interfaces */
export interface IAuthLogin {
    email: string,
    password: string
}

export interface IAuthRegister {
    email: string,
    name: string,
    password: string,
    accountType: TAuthAccountType,
    cnpj?: string
}