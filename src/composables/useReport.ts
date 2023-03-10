import '@leanix/reporting'
import { ref, computed, unref } from 'vue'
import type { IArchitectSubscription, IArchitectCount } from '@/types'
import type { ChartData, ChartDataset } from 'chart.js'
import debounce from 'lodash.debounce'

const bgColors = [
  'rgb(255,0,0,0.8)',
  'rgb(255,128,0,0.8)',
  'rgb(255,255,0,0.8)',
  'rgb(102,204,0,0.8)'
]

const EMPTY_STRING = '(empty)'
const completionLevelDict = new Map<number, string>(
  Object.entries({
    0: EMPTY_STRING,
    1: '<25% complete',
    2: '26 - 75% complete',
    3: '76 - 99% complete',
    4: '100 %complete'
  }).map(([key, value]) => [parseInt(key), value])
)

const completionLevelDictReverse = new Map<string, number>()
completionLevelDict.forEach((value, key) =>
  completionLevelDictReverse.set(value, key)
)

const chartData = ref<ChartData<'bar', number[]> | null>(null)
const architectCounts = ref<IArchitectCount[]>([])

// query component and return all { owner, pipeline }
export const queryData = async (
  filter?: lxr.ReportFacetsSelection
): Promise<IArchitectSubscription[]> => {
  // Destructing assignment of filter object with alias for facets and fullTextSearch attributes
  const facetFilters: lxr.FacetFilter[] = filter?.facets ?? [
    {
      facetKey: 'FactSheetTypes',
      operator: 'OR' as lxr.FacetKeyOperator.OR,
      keys: ['ITComponent']
    },
    {
      facetKey: 'category',
      operator: 'OR' as lxr.FacetKeyOperator.OR,
      keys: ['component']
    },
    {
      facetKey: 'installStatus',
      operator: 'NOR' as lxr.FacetKeyOperator.NOR,
      keys: ['retired']
    }
  ]

  const query =
    'query allFactSheetsQuery($filter: FilterInput!, $sortings: [Sorting]) { allFactSheets(first: 3000, filter: $filter, sort: $sortings) { totalCount edges { node { ... on ITComponent { displayName completion { completion percentage } relITComponentToProductTeamUserGroup { edges { node { factSheet { ... on UserGroup { name parentRelation: relToParent { edges { node { factSheet { ... on UserGroup { name u_agileTeamType parentRelation: relToParent { edges { node { factSheet { ... on UserGroup { name u_agileTeamType } } } } } } } } } } } } } } } subscriptions { edges { node { user { id firstName lastName email } type roles { id name } } } } } } } }}'
  const variables = {
    filter: {
      responseOptions: {
        maxFacetDepth: 5
      },
      facetFilters,
      ids: filter?.directHits?.map(({ id }) => id)
    },
    fullTextSearch: filter?.fullTextSearchTerm,
    sortings: [
      {
        key: 'displayName',
        order: 'asc'
      }
    ]
  }

  try {
    lx.showSpinner()
    const result: IArchitectSubscription[] = await lx
      .executeGraphQL(query, JSON.stringify(variables))
      .then(({ allFactSheets }) => {
        const ret: IArchitectSubscription[] = []
        for (let i = 0; i < allFactSheets.edges.length; i++) {
          const node = allFactSheets.edges[i].node
          const completionPercent =
            node?.completion?.percentage ?? (-1 as number)
          let completionLevel = 0
          if (completionPercent > -1) {
            if (completionPercent <= 25) completionLevel = 1
            else if (completionPercent <= 75) completionLevel = 2
            else if (completionPercent < 100) completionLevel = 3
          }

          for (let j = 0; j < node.subscriptions.edges.length; j++) {
            const subNode = node.subscriptions.edges[j].node
            if (
              subNode.type == 'RESPONSIBLE' &&
              subNode.roles != null &&
              subNode.roles.length > 0
            ) {
              for (let i = 0; i < subNode.roles.length; i++) {
                if (
                  subNode.roles[i].name == 'Product Area Architect' ||
                  subNode.roles[i].name == 'Product Family Architect'
                ) {
                  const id = subNode.user.id as string
                  const name =
                    subNode.user.lastName != null
                      ? `${subNode.user.firstName} ${subNode.user.lastName}`
                      : subNode.user.email
                  ret.push({ id, name, completionLevel })
                }
              }
            }
          }
        }
        return ret
      })
    return result
  } catch (error) {
    console.error('error in fetchGraphQLData', error)
    throw error
  } finally {
    lx.hideSpinner()
  }
}

export const createChartData = (
  input: IArchitectSubscription[]
): ChartData<'bar', number[]> => {
  // calculate completion buckets
  const completionLevels = [
    ...new Set(input.map(({ completionLevel }) => completionLevel))
  ].sort()

  architectCounts.value = Object.values(
    input.reduce((acc: Record<string, IArchitectCount>, rec) => {
      const { id, name } = rec

      if (!acc[id]) acc[id] = { id, name, counts: new Map<number, number>() }

      acc[id].counts.set(
        rec.completionLevel,
        (acc[id].counts.get(rec.completionLevel) ?? 0) + 1
      )

      return acc
    }, {})
  )

  const labels: string[] = unref(architectCounts).map(({ name }) => name)

  const datasets: Array<ChartDataset<'bar', number[]>> = completionLevels.map(
    (completionLevel) => ({
      label:
        completionLevelDict.get(completionLevel) ??
        `unknown?: ${completionLevel}`,
      data: unref(architectCounts).map(
        ({ counts }) => counts.get(completionLevel) ?? 0
      ),
      backgroundColor: bgColors[completionLevel] ?? 'black',
      stack: 'bar',
      barPercentage: 1
    })
  )
  const data: ChartData<'bar', number[]> = { labels, datasets }
  return data
}

export const fetchData = debounce(
  async (filter?: lxr.ReportFacetsSelection) => {
    chartData.value = createChartData(await queryData(filter))
  },
  1000
)

const navigateToInventory = (architectIndex: number) => {
  const architectId = unref(architectCounts)[architectIndex]?.id ?? null
  if (architectId === null) throw Error('invalid architect id')
  lx.navigateToInventory({
    facetFilters: [
      {
        facetKey: 'FactSheetTypes',
        operator: 'OR' as lxr.FacetKeyOperator.OR,
        keys: ['ITComponent']
      },
      {
        facetKey: 'category',
        operator: 'OR' as lxr.FacetKeyOperator.OR,
        keys: ['component']
      },
      {
        facetKey: 'installStatus',
        operator: 'NOR' as lxr.FacetKeyOperator.NOR,
        keys: ['retired']
      },
      {
        facetKey: 'Subscriptions',
        operator: 'OR' as lxr.FacetKeyOperator.OR,
        keys: [architectId]
      }
    ]
  })
}

const initializeReport = async () => {
  await lx.init()
  await lx.ready({
    allowTableView: false,
    facets: [
      {
        key: 'itComponent',
        label: lx.translateFactSheetType('ITComponent', 'plural'),
        fixedFactSheetType: 'ITComponent',
        defaultFilters: [
          {
            facetKey: 'category',
            operator: 'OR' as lxr.FacetKeyOperator.OR,
            keys: ['component']
          },
          {
            facetKey: 'installStatus',
            operator: 'NOR' as lxr.FacetKeyOperator.NOR,
            keys: ['retired']
          }
        ],
        facetFiltersChangedCallback: (filters) => fetchData(filters)
      }
    ]
  })
}

const useReport = () => {
  return {
    initializeReport,
    navigateToInventory,
    chartData: computed(() => unref(chartData))
  }
}

export default useReport
