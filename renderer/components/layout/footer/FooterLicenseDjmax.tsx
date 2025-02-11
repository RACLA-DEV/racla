const FooterLicenseDjmaxRespectV = () => {
  return (
    <span className='tw-text-xs tw-animate-fadeInLeft tw-cursor-pointer'>
      <span onClick={() => window.ipc.openBrowser('https://store.steampowered.com/app/960170')}>
        Resources from DJMAX RESPECT V
      </span>
      <span onClick={() => window.ipc.openBrowser('https://www.neowiz.com/')}>(©NEOWIZ)</span>
    </span>
  )
}

export default FooterLicenseDjmaxRespectV
