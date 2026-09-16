import astronaut from '../../../assets/astronaut-transparent.png';
import performance from '../../../assets/performance.webp';
import { BAND_PACKET } from '../../sections/BandDossier/bandMembers';
import { HandbillArt, HandbillBand, HandbillBody, HandbillFoot, HandbillKicker, HandbillPhoto, HandbillTitle } from './Handbill';

/** The front: the name as big as the card allows, the astronaut over a sunburst, the lineup in a bar. */
export const BAND_HANDBILL_FRONT = (
  <>
    <HandbillKicker right="Future rock">New Jersey · est. 2012</HandbillKicker>
    <HandbillTitle>
      Funkadelic
      <br />
      Astronaut
    </HandbillTitle>
    <HandbillArt src={astronaut} height={420} />
    <HandbillBand>Keys · Drums · Bass · Vox</HandbillBand>
    <HandbillFoot right="over →">Three friends · funk meets electronics</HandbillFoot>
  </>
);

/** The back: who they are, in the typed face, with the live photo in one ink. */
export const BAND_HANDBILL_BACK = (
  <>
    <HandbillKicker right="Reverse">About the band</HandbillKicker>
    <HandbillTitle size={62}>
      Three friends.
      <br />
      One orbit.
    </HandbillTitle>
    <HandbillBody>{BAND_PACKET.card?.children}</HandbillBody>
    <HandbillPhoto src={performance} alt="Funkadelic Astronaut performing live" caption="Live set · Northeast" height={300} focus="50% 40%" />
    <HandbillFoot right="← over">Listen: Spotify · Apple Music · YouTube · Bandcamp</HandbillFoot>
  </>
);
