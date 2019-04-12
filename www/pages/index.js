import React from 'react'
import autoBind from 'auto-bind'
import fetch from 'isomorphic-fetch'
import classNames from 'class-names'
import Fade from 'react-fade-in'

const API = 'https://raxo.now.sh/api'

// return article tag for first render, Fade otherwise
const getHorariosRenderer = firstRender =>
  firstRender ? ({ children }) => <article>{children}</article> : Fade

export default class extends React.Component {
  static async getInitialProps ({ req }) {
    const res = await fetch(API)
    const json = await res.json()

    return { horarios: json }
  }

  constructor (props) {
    super(props)

    autoBind(this)

    this.firstRender = true

    this.state = {
      place: 'rp',
      date: 'today',
      horarios: props.horarios,
      loading: false
    }
  }

  placeNavClicked (place) {
    this.setState({ place })
  }

  dateNavClicked (date) {
    this.setState({ loading: true, date })
    let promise
    if (date === 'tomorrow') {
      const now = new Date()
      promise = fetch(
        `${API}/${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate() +
          1}`
      )
    } else {
      promise = fetch(API)
    }
    promise.then(res => {
      res.json().then(horarios => {
        this.setState({ horarios, loading: false })
      })
    })
  }

  componentDidMount () {
    this.firstRender = false
  }

  render () {
    const HorariosRenderer = getHorariosRenderer(this.firstRender)

    return (
      <div>
        <nav>
          <div
            onClick={() => this.placeNavClicked('rp')}
            className={classNames({ selected: this.state.place === 'rp' })}>
            Raxó - Pontevedra
          </div>
          <div
            onClick={() => this.placeNavClicked('pr')}
            className={classNames({ selected: this.state.place === 'pr' })}>
            Pontevedra - Raxó
          </div>
        </nav>
        <nav>
          <div
            onClick={() => this.dateNavClicked('today')}
            className={classNames({ selected: this.state.date === 'today' })}>
            Hoxe
          </div>
          <div
            onClick={() => this.dateNavClicked('tomorrow')}
            className={classNames({ selected: this.state.date === 'tomorrow' })}>
            Mañá
          </div>
        </nav>
        {this.state.loading ? (
          <section className='loading'>
            <i className='fas fa-sync fa-spin' />
          </section>
        ) : (
          <section>
            <i className='far fa-calendar-alt' />
            <HorariosRenderer>
              {this.state.horarios[this.state.place].map(horario => (
                <div>{horario}</div>
              ))}
            </HorariosRenderer>
          </section>
        )}
        <style jsx>{`
          nav {
            text-align: center;
            font-family: Helvetica, Arial, sans-serif;
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
            margin: 0.5em;
            padding: 1em;
            color: tomato;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            border-radius: 5px;
            cursor: pointer;
          }
          nav > div:hover {
            background-color: #f4f9ff;
          }
          nav > div.selected {
            font-weight: bold;
            border-bottom: 5px solid tomato;
            border-radius: 5px 5px 0 0;
            color: tomato;
          }
          section div {
            width: 150px;
          }
          .loading {
            text-align: center;
          }
          i {
            margin-bottom: 0.6em;
          }
        `}</style>
      </div>
    )
  }
}
