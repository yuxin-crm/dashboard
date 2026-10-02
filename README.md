# 裕信售後營運儀表板

網址：https://yuxin-crm.github.io/dashboard/

保固（3 年／100,000 km，先到者為準）、回廠與保養、車齡車型、工單營收，可依服務廠、服務專員、關懷業務下鑽。

## 內容

| 路徑 | 說明 |
|---|---|
| `app/index.html` | 儀表板主頁（`#/board` 等頁面切換） |
| `app/js/app.js` | 頁面、表格排序、CSV 匯出 |
| `app/css/app.css` | 版面樣式 |
| `app/data/data.js` | 彙總數字（由 `yuxin-crm/crm` 的 `tools/excel-analysis/DashboardAggregates.cs` 產生） |

## 資料安全

- **這是公開儲存庫。** 只放彙總數字與員工姓名，**不可放客戶姓名、電話、地址或原始 Excel**。
- 原始資料與分析程式在私人儲存庫 `yuxin-crm/crm`。
- 已設定 `noindex`，降低被搜尋引擎收錄的機會，但知道網址的人仍可開啟。

## 更新資料

1. 在 `yuxin-crm/crm` 執行 `DashboardAggregates.cs` 產生彙總 JSON
2. 將結果存成 `app/data/data.js`，內容格式為 `window.YX_DATA={...};`
3. commit 並 push，GitHub Pages 約 1 分鐘後更新

## 車輛查詢（只在本機）

「車輛查詢」頁可用牌照號碼或車主查詢，並依車型、車齡、里程、保固、服務廠、專員、業務、消費習慣篩選，帶出車主與車輛基本資料。

- 因為含車主姓名、手機等客戶個資，**資料不放在這個公開儲存庫**，GitHub Pages 上這一頁只顯示說明。
- 本機使用：直接開啟 `C:\Projects\yuxin-dashboard\app\index.html`，頁面會讀取 `C:\Projects\yuxin-crm\private\vehicles.js`（私人專案、已被 .gitignore 排除）。
- 資料檔由私人儲存庫的 `tools/excel-analysis/VehicleLookupExport.cs` 從 Excel 產生。
