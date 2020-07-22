import React from 'react';
import autoBind from 'auto-bind';
import fetch from 'isomorphic-fetch';
import classNames from 'class-names';
import Fade from 'react-fade-in';

let API = 'https://raxo.now.sh/api';

if (process.env.NODE_ENV !== 'production') {
  API = 'http://localhost:3000/api';
}

const RAXO = 10556
const PONTEVEDRA = 10530

// return article tag for first render, Fade otherwise
const getHorariosRenderer = firstRender =>
  firstRender ? ({children}) => <article>{children}</article> : Fade;

const dateToString = (date) => `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`

const buildFetchUrl = (from, to, date) => `${API}/${from}/${to}/${dateToString(date)}`

const isToday = (date) => {
  const now = new Date()
  return date.getDate() == now.getDate() &&
    date.getMonth() == now.getMonth() &&
    date.getFullYear() == now.getFullYear()
}

const makeTomorrowDate = () => {
  const now = new Date
  now.setDate(now.getDate() + 1)
  return now
}

export default class extends React.Component {
  static async getInitialProps() {
    const now = new Date
    const res = await fetch(buildFetchUrl(RAXO, PONTEVEDRA, now))
    const json = await res.json()

    return {horarios: json, from: RAXO, to: PONTEVEDRA, date: now};
  }

  constructor(props) {
    super(props);

    autoBind(this);

    this.firstRender = true;
    this.fetchCache = {[buildFetchUrl(props.from, props.to, new Date(props.date))]: props.horarios}; // init cache
    this.state = {
      from: props.from,
      to: props.to,
      date: new Date(props.date),
      horarios: props.horarios,
      loading: false,
    };
  }

  async fetchTrip(from, to, date) {
    const url = buildFetchUrl(from, to, date)
    if (this.fetchCache.hasOwnProperty(url)) {
      return this.fetchCache[url]
    }

    const res = await fetch(url, { headers: {'Access-Control-Allow-Origin': '*'} });
    const json = await res.json();

    this.fetchCache[url] = json

    return json
  }

  placeNavClicked(from, to) {
    this.setState({ loading: true })
    this.fetchTrip(from, to, this.state.date)
      .then(results => {
         this.setState({ from, to, horarios: results, loading: false })
      })
  }

  dateNavClicked(date) {
    this.setState({loading: true, date});

    this.fetchTrip(this.state.from, this.state.to, date)
      .then(results => {
         this.setState({ date, horarios: results, loading: false })
      })
  }

  componentDidMount() {
    this.firstRender = false;
  }

  render() {
    const HorariosRenderer = getHorariosRenderer(this.firstRender);

    return (
      <div>
        <nav>
          <div
            onClick={() => this.placeNavClicked(RAXO, PONTEVEDRA)}
            className={classNames({selected: this.state.from === RAXO})}>
            Raxó - Pontevedra
          </div>
          <div
            onClick={() => this.placeNavClicked(PONTEVEDRA, RAXO)}
            className={classNames({selected: this.state.from === PONTEVEDRA})}>
            Pontevedra - Raxó
          </div>
        </nav>
        <nav>
          <div
            onClick={() => this.dateNavClicked(new Date)}
            className={classNames({selected: isToday(this.state.date)})}>
            Hoxe
          </div>
          <div
            onClick={() => this.dateNavClicked(makeTomorrowDate())}
            className={classNames({selected: !isToday(this.state.date)})}>
            Mañá
          </div>
        </nav>
        {this.state.loading ? (
          <section className="loading">
            <i className="fas fa-sync fa-spin" />
          </section>
        ) : (
          <section>
            <i className="far fa-calendar-alt" />
            <HorariosRenderer>
              {this.state.horarios.map(horario => (
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
            text-align: center;
          }
          .loading {
            text-align: center;
          }
          i {
            margin-bottom: 0.6em;
          }
        `}</style>
      </div>
    );
  }
}
