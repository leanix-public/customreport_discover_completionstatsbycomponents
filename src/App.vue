<template>
  <!--div class="container mx-auto text-md text-gray-800"-->
  <div class="h-screen flex flex-col">
    <!-- spinner -->
    <div
      v-if="chartData === null"
      class="flex items-center justify-center h-full">
      <div
        class="w-16 h-16 border-b-2 border-gray-900 rounded-full animate-spin"></div>
    </div>
    <!-- chart container -->
    <div v-else class="flex-1 flex flex-col">
      <!-- chart title -->
      <div class="text-4xl mb-2">
        Completion Stats For Components by Architects
      </div>
      <!-- chart message -->
      <div class="relative border rounded shadow bg-blue-50">
        <span
          >Following Chart does not display stats for Components that are
          missing Architect assignment
        </span>
      </div>
      <div class="flex-1">
        <bar-chart />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import useReport from '@/composables/useReport'
import BarChart from '@/components/BarChart.vue'

const { initializeReport, chartData } = useReport()
initializeReport()
</script>
