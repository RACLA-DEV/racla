const fs = require('fs')
const path = require('path')

// CI 환경에서 사용할 환경 변수 파일 생성
function createEnvFile() {
  const envContent = `
# 이 파일은 GitHub Actions CI에서 자동 생성됩니다
VITE_APP_VERSION=${process.env.GITHUB_REF_NAME || 'dev'}
VITE_BUILD_DATE=${new Date().toISOString()}
`

  fs.writeFileSync(path.join(process.cwd(), '.env.production'), envContent)
  console.log('Created .env.production file for CI build')
}

createEnvFile()
