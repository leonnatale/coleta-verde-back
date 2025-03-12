/* Interfaces */
export interface IAuthLogin {
    name: string,
    password: string
}

export interface IAuthRegister {
    name: string,
    password: string,
    isEnterprise: boolean
}