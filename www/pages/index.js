import React from 'react'
import autoBind from 'auto-bind'
import fetch from 'isomorphic-fetch'
import classNames from 'class-names'
import Fade from 'react-fade-in'

export default class extends React.Component {
  static async getInitialProps ({ req }) {
    const res = await fetch('https://raxo.now.sh/api')
    const json = await res.json()

    return { horarios: json }
  }

  constructor (props) {
    super(props)

    autoBind(this)

    this.state = { selected: 'rp' }
  }

  navClicked (selected) {
    this.setState({ selected })
  }

  render () {
    return (
      <div>
        <nav>
          <div onClick={() => this.navClicked('rp')} className={classNames({ selected: this.state.selected === 'rp' })}>Raxó - Pontevedra</div>
          <div onClick={() => this.navClicked('pr')} className={classNames({ selected: this.state.selected === 'pr' })}>Pontevedra - Raxó</div>
        </nav>
        <section>
          <img src='./static/time.png' />
          <Fade>
            {
              this.props.horarios[this.state.selected].map(horario => (
                <div>{ horario }</div>
              ))
            }
          </Fade>
        </section>
        <style jsx>{`
          nav {
            text-align: center;
            font-family: Helvetica, Arial;
            margin-bottom: 1em;
          }
          section {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: Helvetica, Arial;
            font-size: 2em;
            color: #666;
          }
          nav > div {
            display: inline-block;
            margin: .5em;
            padding: 1em;
            border: 1px solid royalblue;
            border-radius: 10px;
            cursor: pointer;
          }
          nav > div:hover {
            background-color: #f4f9ff;
          }
          nav > div.selected {
            font-weight: bold;
            background-color: royalblue;
            color: white;
          }
          section div {
            width: 150px;
          }
          section img {
            width: 35px;
            margin-bottom: .7em;
          }
        `}</style>
      </div>
    )
  }
}
