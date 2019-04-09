import App, { Container } from 'next/app'
import Head from 'next/head'
import React from 'react'

export default class extends App {
  render () {
    const { Component, pageProps } = this.props
    return (
      <Container>
        <Head>
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <meta charSet='utf-8' />
        </Head>
        <Component {...pageProps} />
      </Container>
    )
  }
}
