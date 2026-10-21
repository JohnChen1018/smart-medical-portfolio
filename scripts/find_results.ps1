$ErrorActionPreference = "SilentlyContinue"
$roots = @("C:\Users\John\Desktop", "C:\Users\John\Documents", "D:\")
$hits = @()
foreach ($root in $roots) {
    Get-ChildItem $root -Recurse -Depth 5 -File -Include *.csv, *.xlsx, *.xls, *.json |
    Where-Object {
        $_.Name -match "result|結果|metric|score|summary|stardist|conic|mpq|pq" -or
        $_.FullName -match "結果|result|StarDist|CoNIC|exp_?\d"
    } |
    ForEach-Object { $hits += $_ }
}
$hits |
Sort-Object LastWriteTime -Descending |
Select-Object -First 60 FullName, Length, LastWriteTime |
Format-Table -AutoSize |
Out-String -Width 320
