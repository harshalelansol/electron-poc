import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { useStatistics } from "./useStatistics";
import { Chart } from "./Chart";

function App() {
  const staticData = useStaticData();
  const statistics = useStatistics(10);
  const [activeView, setActiveView] = useState<View>("CPU");

  // Extract the latest CPU temperature
  const latestCpuTemp = useMemo(
    () => (statistics.length ? statistics[statistics.length - 1].cpuTemp : 0),
    [statistics]
  );

  // Memoized CPU usage, RAM usage, and storage usage
  const cpuUsages = useMemo(() => statistics.map((stat) => stat.cpuUsage), [statistics]);
  const ramUsages = useMemo(() => statistics.map((stat) => stat.ramUsage), [statistics]);
  const storageUsages = useMemo(() => statistics.map((stat) => stat.storageUsage), [statistics]);

  // Switch between active usages based on the selected view
  const activeUsages = useMemo(() => {
    switch (activeView) {
      case "CPU":
        return cpuUsages;
      case "RAM":
        return ramUsages;
      case "STORAGE":
        return storageUsages;
      default:
        return [];
    }
  }, [activeView, cpuUsages, ramUsages, storageUsages]);

  // Subscribe to change view event from Electron
  useEffect(() => {
    return window.electron.subscribeChangeView((view) => setActiveView(view));
  }, []);

  return (
    <div className="App">
      <Header />
      <div className="main">
        <div>
          <h1>System Statistics</h1>
          <p>Current CPU Temperature: {latestCpuTemp.toFixed(2)} °C</p>
          <SelectOption
            onClick={() => setActiveView("CPU")}
            title="CPU"
            view="CPU"
            subTitle={staticData?.cpuModel ?? ""}
            data={cpuUsages}
          />
          <SelectOption
            onClick={() => setActiveView("RAM")}
            title="RAM"
            view="RAM"
            subTitle={(staticData?.totalMemoryGB?.toString() ?? "") + " GB"}
            data={ramUsages}
          />
          <SelectOption
            onClick={() => setActiveView("STORAGE")}
            title="STORAGE"
            view="STORAGE"
            subTitle={(staticData?.totalStorage?.toString() ?? "") + " GB"}
            data={storageUsages}
          />
        </div>
        <div className="mainGrid">
          <h2>Active View: {activeView}</h2>
          {activeView === "CPU" && (
            <p className="currentCpuUsage">
              Current CPU Usage: {Math.round(cpuUsages[cpuUsages.length - 1] * 100) || 0}%
            </p>
          )}
          <Chart selectedView={activeView} data={activeUsages} maxDataPoints={10} />
        </div>
      </div>
    </div>
  );
}

// SelectOption Component
function SelectOption(props: {
  title: string;
  view: View;
  subTitle: string;
  data: number[];
  onClick: () => void;
}) {
  return (
    <button className="selectOption" onClick={props.onClick}>
      <div className="selectOptionTitle">
        <div>{props.title}</div>
        <div>{props.subTitle}</div>
      </div>
      <div className="selectOptionChart">
        <Chart selectedView={props.view} data={props.data} maxDataPoints={10} />
      </div>
    </button>
  );
}

// Header Component
function Header() {
  return (
    <header>
      <button id="close" onClick={() => window.electron.sendFrameAction("CLOSE")} />
      <button id="minimize" onClick={() => window.electron.sendFrameAction("MINIMIZE")} />
      <button id="maximize" onClick={() => window.electron.sendFrameAction("MAXIMIZE")} />
    </header>
  );
}

// useStaticData Hook
function useStaticData() {
  const [staticData, setStaticData] = useState<StaticData | null>(null);

  useEffect(() => {
    (async () => {
      setStaticData(await window.electron.getStaticData());
    })();
  }, []);

  return staticData;
}

export default App;
