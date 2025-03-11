/* Enums */
enum EColetaRole {
    user,
    enterprise,
    employee,
    admin
}

/* Interfaces */
export interface IColetaUser {
    id: number,
    name: string,
    role: EColetaRole
}