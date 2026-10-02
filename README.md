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
