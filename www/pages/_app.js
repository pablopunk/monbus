import App from 'next/app'
import Head from 'next/head'
import React from 'react'

export default class extends App {
  render () {
    const { Component, pageProps } = this.props
    return (
      <>
        <Head>
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <meta charSet='utf-8' />
          <link rel='stylesheet' href='https://use.fontawesome.com/releases/v5.8.1/css/all.css' integrity='sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf' crossOrigin='anonymous' />
        </Head>
        <Component {...pageProps} />
      </>
    )
  }
}
