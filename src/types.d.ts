export interface IArchitectSubscription {
  id: string
  name: string
  completionLevel: number
}

export interface IArchitectCount {
  id: string
  name: string
  counts: Map<number, number>
}
