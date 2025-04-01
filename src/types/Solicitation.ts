/* Types */
export type TColetaType = 'rubble' | 'recycle';

/* Interfaces */
export interface ISolicitationCreation {
    authorId: number,
    type: TColetaType,
    addressIndex: number,
    description: string,
    suggestedValue: number
}

export interface ISolicitationFinalValue {
    id: number,
    employeeId: number,
    finalValue: number
}

export interface ISolicitationAccept {
    id: number,
    employeeId: number
}