<template>
  <Bar
    v-if="chartData !== null"
    :data="chartData"
    :options="options"
    class="mt-4 mx-auto max-w-6xl w-full" />
</template>

<script lang="ts" setup>
import useReport from '@/composables/useReport'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartOptions
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
const { chartData, navigateToInventory } = useReport()

const options: ChartOptions<'bar'> = {
  responsive: true,
  interaction: { intersect: false, mode: 'x' },
  scales: { y: { beginAtZero: true, stacked: true } },
  aspectRatio: 3,
  onClick: (evt: any, item: any) => navigateToInventory(item?.[0]?.index)
}
</script>
