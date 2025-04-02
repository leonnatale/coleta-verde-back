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

export interface ISolicitationConsentFinalValue {
    id: number,
    authorId: number,
}

export interface ISolicitationSuggestNewValue {
    id: number,
    authorId: number,
    value: number
}

export interface ISolicitationAccept {
    id: number,
    employeeId: number
}