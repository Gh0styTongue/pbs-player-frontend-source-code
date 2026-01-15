import startsWith from 'lodash-es/startsWith';
import * as React from 'react';
import classNames from 'classnames';

import './color-picker.scss';

interface ColorOption {
  label: string;
  value: string;
}

interface ColorPickerProps {
  options: ColorOption[];
  selected?: string;
  onChange: (arg0: ColorOption) => void;
}

const getColorHex = (color: string): string => {
  return startsWith(color, '#') ? color : `#${color}`;
};

const ColorPicker: React.FC<ColorPickerProps> = ({ options, selected, onChange }) => {
  return (
    <div className="color-picker">
      {options.map((o: ColorOption) => {
        return (
          <button
            key={o.value}
            className={classNames({
              'color-picker__color': true,
              'color-picker__color--active': o.value === selected,
            })}
            style={{ background: getColorHex(o.value) }}
            onClick={() => onChange(o)}
          />
        );
      })}
    </div>
  );
}

export default ColorPicker;
