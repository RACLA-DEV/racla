# 기본 URL의 앞부분
$baseUrl = "/images/djmax_respect_v/jackets/"

# 이미지 파일 이름을 저장할 폴더 경로
$outputFolder = "C:\Users\Administrator\Desktop\images"

# 다운로드할 이미지의 범위 (여기서는 1부터 640까지)
$start = 1
$end = 640

# 폴더가 존재하지 않으면 생성
if (-not (Test-Path $outputFolder)) {
    New-Item -Path $outputFolder -ItemType Directory
}

# 반복문을 통해 각 이미지 다운로드
for ($i = $start; $i -le $end; $i++) {
    # 제목 부분 생성 (예: title1, title2, ...)
    $title = "$i"
    
    # 전체 URL 생성
    $imageUrl = "$baseUrl$title.jpg"
    
    # 저장할 파일 경로
    $outputPath = Join-Path -Path $outputFolder -ChildPath "$title.jpg"
    
    # 이미지 다운로드
    try {
        Invoke-WebRequest -Uri $imageUrl -OutFile $outputPath
        Write-Output "다운로드 완료: $imageUrl"
    } catch {
        Write-Output "다운로드 실패: $imageUrl"
    }
}