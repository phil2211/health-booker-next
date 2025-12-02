import { ObjectId } from 'mongodb'

export interface Transaction {
    _id?: string | ObjectId
    therapistId: string | ObjectId
    type: 'CHARGE' | 'CREDIT'
    amount: number
    date: Date
    description: string
    bookingId?: string | ObjectId
    createdAt: Date
}

export type TransactionDocument = Transaction & {
    _id: string
}
