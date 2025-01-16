// async function processResultScreen(imageBuffer, isMenualUpload?, isNotSaveImage?, gameCode?) {
//     if (gameCode == 'djmax_respect_v') {
//       try {
//         console.log('Client Side OCR isResultScreen Requested. Processing image data...')

//         let isResult = []
//         let text = ''
//         let where = ''

//         if (isMenualUpload) {
//           isResult = ['server']
//           text = 'server'
//           where = 'server'
//         } else {
//           // 각 영역별 OCR 검사
//           const regions: { [key: string]: Buffer } = {}
//           const texts: { [key: string]: string } = {}

//           // 설정에 따라 필요한 영역만 검사
//           if (settingData.autoCaptureOcrResultRegion) {
//             regions.result = await sharp(imageBuffer).extract({ width: 230, height: 24, left: 100, top: 236 }).grayscale().linear(1.5, 0).toBuffer()
//             texts.result = await recognizeText(regions.result, 'eng')
//           }

//           if (settingData.autoCaptureOcrOpen3Region) {
//             regions.open3 = await sharp(imageBuffer).extract({ width: 57, height: 26, left: 596, top: 470 }).grayscale().linear(1.5, 0).toBuffer()
//             texts.open3 = await recognizeText(regions.open3, 'eng')
//           }

//           if (settingData.autoCaptureOcrOpen2Region) {
//             regions.open2 = await sharp(imageBuffer).extract({ width: 60, height: 25, left: 693, top: 471 }).grayscale().linear(1.5, 0).toBuffer()
//             texts.open2 = await recognizeText(regions.open2, 'eng')
//           }

//           if (settingData.autoCaptureOcrVersusRegion) {
//             regions.versus = await sharp(imageBuffer).extract({ width: 142, height: 104, left: 755, top: 52 }).grayscale().toBuffer()
//             texts.versus = await recognizeText(regions.versus, 'eng')
//           }

//           // 결과 검사
//           const resultKeywords = ['JUDGEMENT', 'DETAILS', 'DETAIL', 'JUDGE', 'JUDGEMENT DETAILS']

//           if (settingData.autoCaptureOcrResultRegion && texts.result) {
//             isResult = resultKeywords.filter((value) => texts.result.toUpperCase().trim().includes(value) && texts.result.length !== 0)
//             if (isResult.length > 0) {
//               where = 'result'
//               text = texts.result
//             }
//           }

//           // 로직 변경 필요
//           if (!where && settingData.autoCaptureOcrOpen3Region && texts.open3) {
//             if (texts.open3.trim().toUpperCase() == 'MAX') {
//               where = 'open3'
//               isResult = ['open3']
//               text = texts.open3
//             }
//           }

//           if (!where && settingData.autoCaptureOcrOpen2Region && texts.open2) {
//             if (texts.open2.trim().toUpperCase() == 'MAX') {
//               where = 'open2'
//               isResult = ['open2']
//               text = texts.open2
//             }
//           }

//           // 로직 변경 필요
//           if (!where && settingData.autoCaptureOcrVersusRegion && texts.versus) {
//             if (texts.versus.trim().toUpperCase().replaceAll(' ', '') == 'RE') {
//               where = 'versus'
//               isResult = ['versus']
//               text = texts.versus
//             }
//           }
//         }

//         console.log('Client Side OCR isResultScreen:', isResult.length >= 1, `(${text.toUpperCase().trim()})`, `(Result Type: ${where})`)

//         if (isResult.length >= 1 && (!isUploaded || isMenualUpload)) {
//           if (!isMenualUpload) {
//             mainWindow.webContents.send('pushNotification', {
//               time: moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss'),
//               message: 'DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.',
//               color: 'tw-bg-blue-600',
//             })
//             if (settingData.resultOverlay) {
//               overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                 message: 'DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있니다. 잠시만 기다려주세요.',
//                 color: 'tw-bg-blue-600',
//               })
//             }
//           }
//           console.log('Server Side OCR PlayData Requested. Processing image data...')
//           try {
//             const serverOcrStartTime = Date.now()
//             const formData = new FormData()
//             // const fuckBuffer = where == 'open2' || where == 'open3' ? await delay(3000).then(() => captureScreen('djmax_respect_v')) : imageBuffer
//             const fuckBuffer = imageBuffer
//             formData.append('file', fuckBuffer, {
//               filename: randomUUID() + '.png',
//               contentType: 'image/png',
//             })
//             formData.append('where', where)
//             const session = await getSession()
//             const response = await axios.post(`${isProd ? 'https://near.r-archive.zip/api' : 'https://noah.r-archive.zip/api'}/v1/ocr/upload`, formData, {
//               headers: {
//                 ...formData.getHeaders(),
//                 Authorization: isLogined ? `${session.vArchiveUserNo}|${session.vArchiveUserToken}` : '',
//               },
//               withCredentials: true,
//             })
//             console.log('Server Side OCR PlayData Result:', { ...response.data, processedTime: Date.now() - serverOcrStartTime + 'ms' })

//             const { playData } = response.data

//             if (playData.isVerified || playData.screenType == 'versus' || playData.screenType == 'collection') {
//               const filePath = path.join(
//                 app.getPath('pictures'),
//                 'RACLA',
//                 gameCode.toUpperCase().replaceAll('_', ' ') +
//                   '-' +
//                   (playData.screenType == 'versus' || playData.screenType == 'collection' ? 'Versus' : String(playData.songData.name).replaceAll(':', '-')) +
//                   '-' +
//                   (playData.screenType == 'versus' || playData.screenType == 'collection' ? 'Match' : String(playData.score)) +
//                   '-' +
//                   moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss') +
//                   '.png',
//               )

//               // 프로필 영역 좌표 정의
//               const profileRegions = {
//                 djmax_respect_v: {
//                   result: {
//                     myProfile: { left: 1542, top: 26, width: 320, height: 68 }, // 내 프로필 좌표
//                     otherProfile: { left: 1, top: 1, width: 1, height: 1 }, // 다른 사람 프로필 좌표
//                   },
//                   select: {
//                     myProfile: { left: 1522, top: 22, width: 320, height: 68 }, // 플레이어1 프로필 좌표
//                     otherProfile: { left: 1, top: 1, width: 1, height: 1 }, // 플레이어2 프로필 좌표
//                   },
//                   open3: {
//                     myProfile: { left: 211, top: 177, width: 320, height: 68 }, // 플레이어1 프로필 좌표
//                     otherProfile: { left: 777, top: 116, width: 1106, height: 852 }, // 플레이어2 프로필 좌표
//                   },
//                   open2: {
//                     myProfile: { left: 310, top: 176, width: 321, height: 69 }, // 플레이어1 프로필 좌표
//                     otherProfile: { left: 1290, top: 176, width: 321, height: 69 }, // 플레이어2 프로필 좌표
//                   },
//                   versus: {
//                     myProfile: { left: 201, top: 867, width: 320, height: 68 }, // 플레이어1 프로필 좌표
//                     otherProfile: { left: 1401, top: 867, width: 320, height: 68 }, // 플레이어2 프로필 좌표
//                   },
//                   collection: {
//                     myProfile: { left: 1512, top: 22, width: 320, height: 68 }, // 플레이어1 프로필 좌표
//                     otherProfile: { left: 1, top: 1, width: 1, height: 1 }, // 플레이어2 프로필 좌표
//                   },
//                   openSelect: {
//                     myProfile: { left: 1361, top: 216, width: 320, height: 68 }, // 플레이어1 프로필 좌표
//                     otherProfile: { left: 1363, top: 318, width: 316, height: 464 }, // 플레이어2 프로필 좌표
//                   },
//                 },
//               }

//               const applyProfileMask = async (imageBuffer, gameCode, screenType, settings) => {
//                 try {
//                   const image = sharp(imageBuffer)
//                   const regions = profileRegions[gameCode]?.[screenType]
//                   if (!regions) return imageBuffer

//                   let regionsToMask = []

//                   // 설정에 따른 마스킹 영역 결정
//                   if (settings.saveImageWithoutAllProfileWhenCapture) {
//                     if (screenType == 'result' || screenType == 'select' || screenType == 'collection') {
//                       regionsToMask = [regions.myProfile]
//                     } else if (screenType == 'openSelect') {
//                       regionsToMask = [regions.myProfile, regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
//                     } else {
//                       regionsToMask = [regions.myProfile, regions.otherProfile]
//                     }
//                   } else if (settings.saveImageWithoutOtherProfileWhenCapture) {
//                     if (screenType == 'result' || screenType == 'select' || screenType == 'collection') {
//                       regionsToMask = []
//                     } else if (screenType == 'openSelect') {
//                       regionsToMask = [regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
//                     } else {
//                       regionsToMask = [regions.otherProfile]
//                     }
//                   } else {
//                     if (screenType == 'openSelect') {
//                       regionsToMask = [{ left: 58, top: 687, width: 524, height: 256 }]
//                     } else {
//                       regionsToMask = []
//                     }
//                   }

//                   if (regionsToMask.length === 0) return imageBuffer

//                   // 선택된 영역에 마스킹 효과 적용
//                   const overlays = await Promise.all(
//                     regionsToMask.map(async (region) => {
//                       let maskedRegion
//                       if (settings.saveImageBlurMode == 'black') {
//                         // 검은색 마스킹
//                         maskedRegion = await sharp({
//                           create: {
//                             width: region.width,
//                             height: region.height,
//                             channels: 4,
//                             background: '#000000', // 검은색을 hex 값으로 지정
//                           },
//                         })
//                           .jpeg() // 이미지 포맷 지정
//                           .toBuffer()
//                       } else {
//                         // 블러 마스킹
//                         maskedRegion = await sharp(imageBuffer).extract(region).blur(15).toBuffer()
//                       }

//                       return {
//                         input: maskedRegion,
//                         left: region.left,
//                         top: region.top,
//                       }
//                     }),
//                   )

//                   // 마스킹 처리된 영역을 원본 이미지에 합성
//                   return await image.composite(overlays).toBuffer()
//                 } catch (error) {
//                   console.error('Error applying profile mask:', error)
//                   return imageBuffer
//                 }
//               }

//               // 파일 저장 부분 수정
//               if (settingData.saveImageWhenCapture && !isNotSaveImage) {
//                 try {
//                   let finalImageBuffer = imageBuffer

//                   finalImageBuffer = await applyProfileMask(imageBuffer, 'djmax_respect_v', playData.screenType, settingData)

//                   fs.writeFile(filePath, finalImageBuffer, (err) => {
//                     if (err) {
//                       console.error('Failed to save file:', err)
//                     } else {
//                       console.log('File saved to', filePath)
//                     }
//                   })
//                 } catch (error) {
//                   console.error('Error processing image:', error)
//                 }
//               }

//               isUploaded = true
//               if (where !== 'versus' && playData.screenType !== 'versus' && playData.isVerified) {
//                 // 기존 점수 조회
//                 try {
//                   const session = await getSession()
//                   const backupResponse = await axios.get(
//                     `${isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/'}?url=https://v-archive.net/api/archive/${
//                       session.vArchiveUserName
//                     }/title/${playData.songData.title}`,
//                   )
//                   const lastScore = backupResponse.data?.patterns?.[`${playData.button}B`]?.[playData.pattern]?.score || null

//                   settingData.resultOverlay &&
//                     overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                       ...response.data.playData,
//                       lastScore,
//                     })
//                 } catch (error) {
//                   console.error('Error fetching backup data:', error)
//                   settingData.resultOverlay &&
//                     overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                       ...response.data.playData,
//                     })
//                 }
//               } else if (playData.screenType == 'versus') {
//                 playData.versusData.forEach(async (value, index) => {
//                   if (Number(value.score) > 0) {
//                     try {
//                       // 각 플레이어의 기존 점수 조회
//                       const session = await getSession()
//                       const backupResponse = await axios.get(
//                         `${isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/'}?url=https://v-archive.net/api/archive/${
//                           session.vArchiveUserName
//                         }/title/${value.songData.title}`,
//                       )
//                       const lastScore = backupResponse.data?.patterns?.[`${value.button}B`]?.[value.pattern]?.score || null

//                       setTimeout(() => {
//                         settingData.resultOverlay &&
//                           overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                             ...value,
//                             gameCode: 'djmax_respect_v',
//                             lastScore,
//                           })
//                       }, 2000 * index)
//                     } catch (error) {
//                       console.error('Error fetching backup data:', error)
//                       setTimeout(() => {
//                         settingData.resultOverlay &&
//                           overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                             ...value,
//                             gameCode: 'djmax_respect_v',
//                           })
//                       }, 2000 * index)
//                     }
//                   }
//                 })
//               } else if (playData.screenType == 'collection') {
//                 overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                   message: '컬렉션(COLLECTION) 화면 인식에 성공하였습니다. 결과는 RACLA 데스크톱 앱에서 확인해주세요.',
//                   color: 'tw-bg-lime-600',
//                 })
//               } else {
//                 overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                   message: '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
//                   color: 'tw-bg-red-600',
//                 })
//               }
//               isProcessing = false
//               return { ...response.data, filePath: settingData.saveImageWhenCapture && playData.screenType != 'collection' ? filePath : null }
//             } else {
//               isProcessing = false
//               return {
//                 playData: {
//                   isVerified: null,
//                 },
//               }
//             }
//           } catch (error) {
//             console.error('서버 사이드 OCR 요청 실패:', error)
//             overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//               message: '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
//               color: 'tw-bg-red-600',
//             })
//             isProcessing = false
//             return {
//               playData: {
//                 isVerified: false,
//                 error: '서버 사이드 OCR 요청 실패',
//               },
//             }
//           }
//         } else if (isResult.length >= 1 && isUploaded) {
//           console.log('Waiting for Exit Result Screen...')
//           isProcessing = false
//           return {
//             playData: {
//               isVerified: null,
//             },
//           }
//         } else {
//           console.log('Waiting for Result Screen...')
//           isProcessing = false
//           isUploaded = false
//           return {
//             playData: {
//               isVerified: null,
//             },
//           }
//         }
//       } catch (error) {
//         isProcessing = false
//         console.error('Error processing capture:', error)
//       }
//     } else if (gameCode == 'wjmax') {
//       try {
//         console.log('Client Side OCR isResultScreen Requested. Processing image data...')

//         let isResult = []
//         let text = ''
//         let where = ''

//         if (isMenualUpload) {
//           isResult = ['server']
//           text = 'server'
//           where = 'server'
//         } else {
//           // 각 영역별 OCR 검사
//           const regions: { [key: string]: Buffer } = {}
//           const texts: { [key: string]: string } = {}

//           // 설정에 따라 필요한 영역만 검사
//           if (settingData.autoCaptureWjmaxOcrResultRegion) {
//             regions.result = await sharp(imageBuffer).extract({ width: 135, height: 21, left: 1038, top: 307 }).linear(1, 0).toBuffer()
//             texts.result = await recognizeText(regions.result, 'eng')
//           }

//           // 결과 검사
//           const resultKeywords = ['JUDGEMENT', 'JUDGE', 'MENT', 'MENTS', 'JUDGEMENTS']

//           if (settingData.autoCaptureWjmaxOcrResultRegion && texts.result) {
//             isResult = resultKeywords.filter((value) => texts.result.toUpperCase().trim().includes(value) && texts.result.length !== 0)
//             if (isResult.length > 0) {
//               where = 'result'
//               text = texts.result
//             }
//           }
//         }

//         console.log('Client Side OCR isResultScreen:', isResult.length >= 1, `(${text.toUpperCase().trim()})`, `(Result Type: ${where})`)

//         if (isResult.length >= 1 && (!isUploaded || isMenualUpload)) {
//           if (!isMenualUpload) {
//             mainWindow.webContents.send('pushNotification', {
//               time: moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss'),
//               message: 'WJMAX(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.',
//               color: 'tw-bg-blue-600',
//             })
//             if (settingData.resultOverlay) {
//               overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                 message: 'WJMAX(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있니다. 잠시만 기다려주세요.',
//                 color: 'tw-bg-blue-600',
//               })
//             }
//           }
//           console.log('Server Side OCR PlayData Requested. Processing image data...')
//           try {
//             const serverOcrStartTime = Date.now()
//             const formData = new FormData()
//             formData.append('file', imageBuffer, {
//               filename: randomUUID() + '.png',
//               contentType: 'image/png',
//             })
//             formData.append('where', where)
//             const session = await getSession()
//             console.log(session)
//             const response = await axios.post(`${isProd ? 'https://near.r-archive.zip/api' : 'https://noah.r-archive.zip/api'}/v1/ocr/upload/wjmax`, formData, {
//               headers: {
//                 ...formData.getHeaders(),
//                 Authorization: isLogined ? `${session.userNo}|${session.userToken}` : '',
//               },
//               withCredentials: true,
//             })
//             console.log('Server Side OCR PlayData Result:', { ...response.data, processedTime: Date.now() - serverOcrStartTime + 'ms' })

//             const { playData } = response.data

//             if (playData.isVerified || playData.screenType == 'versus') {
//               const filePath = path.join(
//                 app.getPath('pictures'),
//                 'RACLA',
//                 gameCode.toUpperCase().replaceAll('_', ' ') +
//                   '-' +
//                   (playData.screenType == 'versus'
//                     ? 'Versus'
//                     : playData.screenType == 'collection'
//                     ? 'Collection'
//                     : String(playData.songData.name).replaceAll(':', '-')) +
//                   '-' +
//                   (playData.screenType == 'versus' ? 'Match' : playData.screenType == 'collection' ? 'MusicData' : String(playData.score)) +
//                   '-' +
//                   moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss') +
//                   '.png',
//               )

//               // 프로필 영역 좌표 정의
//               const profileRegions = {
//                 wjmax: {
//                   result: {
//                     myProfile: { left: 1546, top: 32, width: 342, height: 70 }, // 플레이어1 프로필 좌표
//                     otherProfile: { left: 1, top: 1, width: 1, height: 1 }, // 플레이어2 프로필 좌표
//                   },
//                 },
//               }

//               const applyProfileBlur = async (imageBuffer, gameCode, screenType, settings) => {
//                 try {
//                   const image = sharp(imageBuffer)
//                   const regions = profileRegions[gameCode]?.[screenType]
//                   if (!regions) return imageBuffer

//                   let regionsToBlur = []

//                   // 설정에 따른 블러 처리 영역 결정
//                   if (settings.saveImageWithoutAllProfileWhenCapture) {
//                     // 모든 프로필 제외 - 모든 프로필에 블러
//                     if (screenType == 'result' || screenType == 'select' || screenType == 'collection') {
//                       regionsToBlur = [regions.myProfile]
//                     } else if (screenType == 'openSelect') {
//                       regionsToBlur = [regions.myProfile, regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
//                     } else {
//                       regionsToBlur = [regions.myProfile, regions.otherProfile]
//                     }
//                   } else if (settings.saveImageWithoutOtherProfileWhenCapture) {
//                     // 내 프로필만 - 다른 프로필만 블러
//                     if (screenType == 'result' || screenType == 'select' || screenType == 'collection') {
//                       regionsToBlur = []
//                     } else if (screenType == 'openSelect') {
//                       regionsToBlur = [regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
//                     } else {
//                       regionsToBlur = [regions.otherProfile]
//                     }
//                   } else {
//                     if (screenType == 'openSelect') {
//                       regionsToBlur = [{ left: 58, top: 687, width: 524, height: 256 }]
//                     } else {
//                       regionsToBlur = []
//                     }
//                   }
//                   // saveImageWithAllProfileWhenCapture가 true인 경우는 블러 처리 없음

//                   if (regionsToBlur.length === 0) return imageBuffer

//                   // 선택된 영역에 블러 효과 적용
//                   const overlays = await Promise.all(
//                     regionsToBlur.map(async (region) => {
//                       const blurred = await sharp(imageBuffer).extract(region).blur(15).toBuffer()

//                       return {
//                         input: blurred,
//                         left: region.left,
//                         top: region.top,
//                       }
//                     }),
//                   )

//                   // 블러 처리된 영역을 원본 이미지에 합성
//                   return await image.composite(overlays).toBuffer()
//                 } catch (error) {
//                   console.error('Error applying profile blur:', error)
//                   return imageBuffer
//                 }
//               }

//               // 파일 저장 부분 수정
//               if (settingData.saveImageWhenCapture && !isNotSaveImage) {
//                 try {
//                   let finalImageBuffer = imageBuffer

//                   finalImageBuffer = await applyProfileBlur(imageBuffer, 'djmax_respect_v', playData.screenType, settingData)

//                   fs.writeFile(filePath, finalImageBuffer, (err) => {
//                     if (err) {
//                       console.error('Failed to save file:', err)
//                     } else {
//                       console.log('File saved to', filePath)
//                     }
//                   })
//                 } catch (error) {
//                   console.error('Error processing image:', error)
//                 }
//               }

//               isUploaded = true
//               if (where !== 'versus' && playData.screenType !== 'versus' && playData.isVerified) {
//                 settingData.resultOverlay && overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', { ...response.data.playData })
//               } else if (playData.screenType == 'versus') {
//                 playData.versusData.forEach((value, index) => {
//                   if (Number(value.score) > 0) {
//                     setTimeout(() => {
//                       settingData.resultOverlay && overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', { ...value })
//                     }, 2000 * (index + 1))
//                   }
//                 })
//               } else {
//                 overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
//                   message: '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
//                   color: 'tw-bg-red-600',
//                 })
//               }
//               isProcessing = false
//               return { ...response.data, filePath: settingData.saveImageWhenCapture ? filePath : null }
//             } else {
//               isProcessing = false
//               return {
//                 playData: {
//                   isVerified: null,
//                 },
//               }
//             }
//           } catch (error) {
//             isProcessing = false
//             console.error('서버 사이드 OCR 요청 실패:', error)
//             return {
//               playData: {
//                 isVerified: false,
//                 error: '서버 사이드 OCR 요청 실패',
//               },
//             }
//           }
//         } else if (isResult.length >= 1 && isUploaded) {
//           isProcessing = false
//           console.log('Waiting for Exit Result Screen...')
//           return {
//             playData: {
//               isVerified: null,
//             },
//           }
//         } else {
//           isProcessing = false
//           console.log('Waiting for Result Screen...')
//           isUploaded = false
//           return {
//             playData: {
//               isVerified: null,
//             },
//           }
//         }
//       } catch (error) {
//         isProcessing = false
//         console.error('Error processing capture:', error)
//       }
//     }
//   }
