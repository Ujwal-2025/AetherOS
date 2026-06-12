import React, { useState, useEffect } from 'react';
import { TextStyle } from 'react-native';
import { AText } from './AText';

interface TypewriterTextProps {
  text:    string;
  speed?:  number; // ms per character
  style?:  TextStyle | TextStyle[];
  onDone?: () => void;
}

export function TypewriterText({ text, speed = 55, style, onDone }: TypewriterTextProps) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    if (!text) return;
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      setVisible(count);
      if (count >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return <AText style={style}>{text.slice(0, visible)}</AText>;
}
