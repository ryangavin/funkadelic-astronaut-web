import { useId } from 'react';
import { PrintInkFilter } from '../../foundations/Distressed/Distressed';
import astronautImage from '../../../assets/astronaut-flat.webp';
import { PaperSheet, type PaperStock } from '../PaperSheet/PaperSheet';
import './Astronaut.css';

// Preserve the approved silhouette from the site's framework-free PaperCutout.
export const ASTRONAUT_PAPER_SHAPE = {
  width: 720,
  height: 1080,
  margin: 80,
  path: 'M 178 147 C 237 21 468 6 556 181 C 575 186 570 230 589 263 C 685 283 686 443 622 491 C 644 518 628 549 608 548 C 627 579 611 594 620 608 C 670 629 660 654 678 678 C 714 718 720 766 718 819 L 715 928 C 704 1000 262 1045 90 1006 C 41 995 -9 916 12 866 C 57 776 85 733 165 694 C 149 673 157 656 174 643 C 142 631 143 609 149 594 C 118 581 114 559 123 543 L 91 500 C 12 484 11 325 94 284 C 108 222 137 187 178 147 Z',
};

export type AstronautProps = {
  /** Paper stock behind the printed astronaut. */
  stock?: PaperStock;
  /** Tilt of the complete cutout, in degrees. */
  rotation?: number;
  /** Empty for decoration; supply text when the illustration conveys meaning. */
  alt?: string;
};

export function Astronaut({ stock = 'wheat', rotation = 0, alt = '' }: AstronautProps) {
  const id = useId().replace(/:/g, '');
  return (
    <div className="astronaut-cutout" aria-hidden={alt ? undefined : true} style={{ rotate: `${rotation}deg` }}>
      <svg className="astronaut-cutout__definitions" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={`${id}-palette`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0.07059 0.07059 0.64706 0.64706 0.91765 0.91765 0.91765 0.91765" />
              <feFuncG type="discrete" tableValues="0.07843 0.07843 0.15686 0.15686 0.82745 0.82745 0.82745 0.82745" />
              <feFuncB type="discrete" tableValues="0.12549 0.12549 0.21569 0.21569 0.65490 0.65490 0.65490 0.65490" />
            </feComponentTransfer>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 2.39999" />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
          <PrintInkFilter id={`${id}-print`} />
        </defs>
      </svg>
      <div style={{ filter: `url(#${id}-print)` }}>
        <PaperSheet stock={stock} shape={ASTRONAUT_PAPER_SHAPE}>
          <img className="astronaut-cutout__image" src={astronautImage} width="720" height="1080" alt={alt}
            style={{ filter: `url(#${id}-palette)` }} />
        </PaperSheet>
      </div>
    </div>
  );
}
