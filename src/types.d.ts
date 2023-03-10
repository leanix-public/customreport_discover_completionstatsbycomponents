export interface IArchitect {
  architect: string
  completionLevel: number
}

export interface IArchitectCount {
  id: string
  name: string
  counts: Map<number, number>
}
