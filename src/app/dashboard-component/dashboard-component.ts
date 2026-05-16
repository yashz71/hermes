import { Component, inject, OnInit, computed, ChangeDetectionStrategy, signal,effect } from '@angular/core';
import { 
  NgApexchartsModule, 
  ApexAxisChartSeries, 
  ApexChart, 
  ApexXAxis, 
  ApexStroke, 
  ApexTheme, 
  ApexTooltip, 
  ApexDataLabels,
  ApexYAxis,
  ApexFill,
  ApexMarkers,
  ApexGrid
} from 'ng-apexcharts';
import { Charts, MarketDataPoint } from '../services/charts';
import { Router } from '@angular/router';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  theme: ApexTheme;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  markers: ApexMarkers;
  colors: string[];
  grid: ApexGrid;
  
};

@Component({
  selector: 'app-dashboard-component',
  imports: [NgApexchartsModule],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private  router= inject(Router);
  constructor() {
    // Effects MUST be in the constructor or a field initializer
    effect(() => {
      const filtered = this.filteredAssets();
      const selected = this.selectedAsset();
  
      // If the selected asset is no longer in the filtered list, reset to the first available
      if (selected && !filtered.includes(selected)) {
        this.selectedAsset.set(filtered[0] ?? null);
      }
    });
  }
  readonly marketTypes = [
    { label: 'Equities (Stocks)', value: 'stocks' },
    { label: 'Commodities', value: 'commodities' },
    { label: 'Fixed Income (Bonds)', value: 'bonds' },
    { label: 'Forex (Currencies)', value: 'currencies' }
  ];
  readonly chartsService = inject(Charts);
  readonly timeframes = ['1D', '1W', '1M', '1Y', 'ALL'];
  readonly selectedTimeframe = signal<string>('1W');
  // 1. State: Tracks which asset button is currently clicked
  readonly selectedAsset = signal<string | null>(null);
  readonly activeMarket = signal<string>('stocks');
  readonly searchQuery = signal('');
  // Action: Called when the dropdown value changes
  readonly data = computed<MarketDataPoint[]>(() => {
    const market = this.activeMarket();
  
    if (market === 'stocks') return this.chartsService.stocks();
    if (market === 'bonds') return this.chartsService.bonds();
    if (market === 'commodities') return this.chartsService.commodities();
    if (market === 'currencies') return this.chartsService.currencies();
  
    return [];
  });
  chooseMarket(market: string): void {
    this.activeMarket.set(market);
    this.selectedAsset.set(null);
  }
  selectTimeframe(tf: string): void {
    this.selectedTimeframe.set(tf);
    // Fetch fresh data from the backend using the new timeframe
    this.chartsService.loadOverview(tf.toLowerCase());
  }
  // 2. Derived: Extracts unique asset names to generate the buttons
  readonly availableAssets = computed<string[]>(() => {
    // Use Set to remove duplicates. Adapt 'asset_name' or 'stocks_name' to your exact DB column
    
    const names = this.data().map(p => p['asset_name'] || 'Unknown Asset');
    return [...new Set(names)].filter(name => name !== 'Unknown Asset');
  });
  readonly filteredAssets = computed<string[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
  
    if (!query) return this.availableAssets();
  
    return this.availableAssets().filter(asset =>
      asset.toLowerCase().includes(query)
    );
  });
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }
  
  // 3. Derived: Filters the chart data based on the selected asset
  readonly stockSeries = computed<ApexAxisChartSeries>(() => {
    const available = this.availableAssets();
    // Auto-select the first asset if nothing is clicked yet
    const currentSelection = this.selectedAsset() || (available.length > 0 ? available[0] : null);
    console.log("available assets: ",available);
    if (!currentSelection) return [];

    // Filter the raw data for ONLY the selected asset
    const filteredData = this.data().filter(p => 
      (p['asset_name']) === currentSelection
    );

    return [{
      name: currentSelection,
      data: filteredData.map(p => ({
        x: new Date(p.created_at).getTime(), 
        y: Number(p.price_value) 
      })).sort((a, b) => a.x - b.x) // Sort chronologically to prevent line criss-crossing
    }];
  });

  // Action: Called when a button is clicked
  selectAsset(assetName: string): void {
    this.selectedAsset.set(assetName);
  }
  readonly chartOptions: Partial<ChartOptions> = {
    chart: { type: 'area', height: 400, stacked: false, zoom: { type: 'x', enabled: true, autoScaleYaxis: true }, toolbar: { show: true }, animations: { enabled: false }, background: 'transparent' },
    stroke: { curve: 'smooth', width: 2 },
    theme: { mode: 'dark', palette: 'palette1' },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] } },
    colors: ['#38bdf8'],
    grid: { borderColor: '#334155', strokeDashArray: 4, xaxis: { lines: { show: true } } },
    yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (val) => `$${val.toFixed(2)}` } },
    xaxis: { type: 'datetime', tickAmount: 6 },
    tooltip: { shared: false, x: { format: 'dd MMM HH:mm:ss' }, y: { formatter: (val) => `$${val.toFixed(2)}` } }
  };
  goToAgent(){
  this.router.navigate(['/Agent']);
  }
  ngOnInit(): void {
    // Initial load defaults to 1W
    this.chartsService.loadOverview('1w');
    
}
}