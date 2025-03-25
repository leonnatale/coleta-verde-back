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
    cpf?: string,
    cnpj?: string
}

export interface IUpdateUser {
    name?: string,
    description?: string,
    password?: string
}