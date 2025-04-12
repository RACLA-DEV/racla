const FooterLicensePlatinaLab = () => {
  return (
    <span className='tw-text-xs tw-animate-fadeInLeft tw-cursor-pointer'>
      <span onClick={() => window.ipc.openBrowser('https://platinalab.net')}>
        Resources from PLATiNA :: LAB (©HIGH-END Games)
      </span>
    </span>
  )
}

export default FooterLicensePlatinaLab
