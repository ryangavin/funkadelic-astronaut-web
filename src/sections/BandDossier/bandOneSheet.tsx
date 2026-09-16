import performance from '../../../assets/performance.webp';
import { BAND_MEMBER_PACKETS, BAND_PACKET, LIVE_SET } from './bandMembers';
import { type OneSheetContent, OneSheetColumns, OneSheetFacts, OneSheetFoot, OneSheetHeading, OneSheetLetterhead, OneSheetNote, OneSheetPhoto, OneSheetPhotoSpill, OneSheetTag, OneSheetText } from '../../components/OneSheet/OneSheet';

const PARTS = ['Keys', 'Drums', 'Bass & vocals'];

/** Bands they have opened for or shared a bill with, their own favorites among them. */
export const SHARED_STAGES = ['The New Deal', 'Dopapod', 'Kung Fu', 'Consider the Source', 'Space Bacon', 'Solar Circuit'];

const list = (names: string[]) => `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** The live shot runs across the first crease: this much of its top is printed on the top panel. */
const LIVE_PHOTO = { src: performance, height: 240, focus: '50% 40%', spill: 56 };

/** The top third: the letterhead with the genre beside it, then the press line: the one-liner and who they have shared a stage with. This is all that shows folded. */
export const BAND_ONE_SHEET_TOP = (
  <>
    <OneSheetLetterhead aside={<OneSheetTag over="Future" under="Rock" />}>Funkadelic Astronaut</OneSheetLetterhead>
    <OneSheetHeading>Press · booking · One-sheet · 2026</OneSheetHeading>
    <OneSheetText>
      <p>
        Three friends blending funk and electronics with keyboards, drums, bass and vocals, who have shared stages with some of their own
        favorites: <strong>{list(SHARED_STAGES)}</strong>.
      </p>
    </OneSheetText>
    <OneSheetPhotoSpill {...LIVE_PHOTO} />
  </>
);

/** The middle third: the live photo and the facts an agent wants at a glance. */
export const BAND_ONE_SHEET_MIDDLE = (
  <>
    <OneSheetPhoto
      {...LIVE_PHOTO}
      alt={BAND_PACKET.photo.alt ?? 'Funkadelic Astronaut performing live'}
      caption={<>Live · {LIVE_SET.caption} at Barrier Brewing Co. · {LIVE_SET.note}</>}
    />
    <OneSheetFacts
      items={[
        { label: 'Lineup', value: 'Keys, drums, bass and vocals' },
        { label: 'From', value: 'New Jersey, since 2012' },
        { label: 'Sound', value: 'Funk meets electronics, across the Northeast' },
      ]}
    />
  </>
);

/** The bottom third: the three of them, where to listen, and who to write to. */
export const BAND_ONE_SHEET_BOTTOM = (
  <>
    <OneSheetHeading>The lineup</OneSheetHeading>
    <OneSheetColumns>
      {BAND_MEMBER_PACKETS.map((member, index) => (
        <OneSheetFacts key={member.name} items={[{ label: PARTS[index], value: <>{member.name}<br />{member.facts?.[0]}</> }]} />
      ))}
    </OneSheetColumns>
    <OneSheetNote>See you out there.</OneSheetNote>
    <OneSheetFoot
      right={
        <a href="mailto:samluba1@gmail.com?subject=Funkadelic%20Astronaut%20Booking">Booking: samluba1@gmail.com</a>
      }
    >
      Spotify · Apple Music · YouTube · Bandcamp
    </OneSheetFoot>
  </>
);

/** The three panels together, as the dossier files them. */
export const BAND_ONE_SHEET: OneSheetContent = { top: BAND_ONE_SHEET_TOP, middle: BAND_ONE_SHEET_MIDDLE, bottom: BAND_ONE_SHEET_BOTTOM };
