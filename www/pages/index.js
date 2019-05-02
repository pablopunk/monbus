import React from 'react';
import autoBind from 'auto-bind';
import fetch from 'isomorphic-fetch';
import classNames from 'class-names';
import Fade from 'react-fade-in';

let API = 'https://raxo.now.sh/api';

if (process.env.NODE_ENV !== 'production') {
  API = 'http://localhost:3001';
}

// return article tag for first render, Fade otherwise
const getHorariosRenderer = firstRender =>
  firstRender ? ({children}) => <article>{children}</article> : Fade;

export default class extends React.Component {
  static async getInitialProps() {
    const res = await fetch(API);
    const json = await res.json();

    return {horarios: json};
  }

  constructor(props) {
    super(props);

    autoBind(this);

    this.firstRender = true;
    this.fetchCache = {[API]: props.horarios}; // init cache

    this.state = {
      place: 'rp',
      date: 'today',
      horarios: props.horarios,
      loading: false,
    };
  }

  placeNavClicked(place) {
    this.setState({place});
  }

  dateNavClicked(date) {
    this.setState({loading: true, date});

    let urlString;

    if (date === 'tomorrow') {
      const now = new Date();
      urlString = `${API}/${now.getFullYear()}/${now.getMonth() +
        1}/${now.getDate() + 1}`;
    } else {
      urlString = API;
    }

    if (this.fetchCache.hasOwnProperty(urlString)) {
      // fetched in cache
      // simulate a fetch by quickly showing the loading icon
      setTimeout(() => {
        this.setState({horarios: this.fetchCache[urlString], loading: false});
      }, 200)
    } else {
      fetch(urlString).then(res => {
        res.json().then(horarios => {
          this.fetchCache[urlString] = horarios
          this.setState({horarios, loading: false});
        });
      });
    }
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
            onClick={() => this.placeNavClicked('rp')}
            className={classNames({selected: this.state.place === 'rp'})}>
            Raxó - Pontevedra
          </div>
          <div
            onClick={() => this.placeNavClicked('pr')}
            className={classNames({selected: this.state.place === 'pr'})}>
            Pontevedra - Raxó
          </div>
        </nav>
        <nav>
          <div
            onClick={() => this.dateNavClicked('today')}
            className={classNames({selected: this.state.date === 'today'})}>
            Hoxe
          </div>
          <div
            onClick={() => this.dateNavClicked('tomorrow')}
            className={classNames({selected: this.state.date === 'tomorrow'})}>
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
    );
  }
}
