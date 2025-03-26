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