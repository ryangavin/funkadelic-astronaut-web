import festivalMap from '../../../assets/festival-map.webp';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { Distressed } from '../../foundations/Distressed/Distressed';
import { Inkjet } from '../../foundations/Inkjet/Inkjet';
import './DeskPapers.css';

/** The label's running order for the festival day, a draft off the office printer on its letterhead, with the band's slot pencilled in. */
export function RunSheet() {
  return (
    <Weathered className="run-sheet" grain wear={0.25}>
      <div className="run-sheet__page">
        <Distressed className="run-sheet__stamp">
          <span className="run-sheet__stamp-ink">Draft</span>
        </Distressed>
        <p className="run-sheet__letterhead">
          <span className="run-sheet__label">Mission Control</span>
          <span className="run-sheet__label-line">records · management · events</span>
        </p>
        <h2 className="run-sheet__title">Nyack Neighborhood Music &amp; Arts Festival</h2>
        <p className="run-sheet__meta">Main stage · Saturday, September 26, 2026 · running order v3</p>
        <table className="run-sheet__slots">
          <tbody>
            <tr>
              <th scope="row">2:00 pm</th>
              <td>Opener — tbd</td>
            </tr>
            <tr>
              <th scope="row">3:15 pm</th>
              <td>tbd (hold for the school band?)</td>
            </tr>
            <tr>
              <th scope="row">4:30 pm</th>
              <td>Changeover · DJ</td>
            </tr>
            <tr className="run-sheet__slot--band">
              <th scope="row">6:00 pm</th>
              <td>Funkadelic Astronaut · 45 min</td>
            </tr>
            <tr>
              <th scope="row">7:30 pm</th>
              <td>Headliner — tbd</td>
            </tr>
            <tr>
              <th scope="row">9:00 pm</th>
              <td>Curfew</td>
            </tr>
          </tbody>
        </table>
        <span className="run-sheet__pen" aria-hidden="true">
          confirm!! → call Sam
        </span>
        <span className="run-sheet__circle" aria-hidden="true" />
      </div>
    </Weathered>
  );
}

/** The festival's site plan: the map from the poster, run off on the office inkjet onto a letter sheet. */
export function SitePlan() {
  return (
    <Weathered className="site-plan" grain wear={0.2}>
      <div className="site-plan__page">
        <p className="site-plan__head">
          <span className="run-sheet__label">Mission Control</span>
          <span>Nyack Neighborhood Music &amp; Arts Festival · site plan · v2</span>
        </p>
        <Inkjet className="site-plan__print" seed={3}>
          <img className="site-plan__map" src={festivalMap} alt="Site plan of the festival grounds: the stages, the camp and the pond, drawn as a map" />
        </Inkjet>
      </div>
    </Weathered>
  );
}

