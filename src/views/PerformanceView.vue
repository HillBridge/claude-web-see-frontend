<template>
  <div class="performance-view">
    <h2 class="page-title">性能监控</h2>
    <div id="echart" style="width: 400px; height: 300px"></div>
  </div>
</template>

<script>
export default {
  name: 'PerformanceView',
  mounted() {
    this.initChart();
  },
  methods: {
    initChart() {
      let myChart = this.$echarts.init(document.getElementById('echart'));
      let option = {
        animation: false,
        title: { text: 'ECharts 入门示例' },
        tooltip: {},
        legend: { data: ['销量'] },
        xAxis: { data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'] },
        yAxis: {},
        series: [{ name: '销量', type: 'bar', data: [5, 20, 36, 10, 10, 20] }]
      };
      myChart.setOption(option);
    }
  }
};
</script>

<style lang="less">
.performance-view {
  padding: 20px 0;

  .page-title {
    text-align: left;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 700;
  }
}
</style>
