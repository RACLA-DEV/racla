const FooterLicenseTjmax = () => {
  return (
    <span className="tw-text-xs tw-animate-fadeInLeft tw-cursor-pointer">
      <span onClick={() => window.ipc.openBrowser('https://cafe.naver.com/tteokbokk1/533412')}>Resources from TJMAX</span> /{' '}
      <span onClick={() => window.ipc.openBrowser('https://www.youtube.com/@stellive_official')}>StelLive Official</span> /{' '}
      <span onClick={() => window.ipc.openBrowser('https://stellive.me/')}>©StelLive</span>
    </span>
  )
}

export default FooterLicenseTjmax
