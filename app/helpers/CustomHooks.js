import { useState, useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';

import i18n from '../locales/languages';
import survey_en from '../views/assessment/survey.en.json';

const surveys = {
  en: survey_en,
};

export function useSurvey() {
  let [survey] = useState(() => {
    return surveys[i18n.language] || survey_en;
  });
  return survey;
}

const deepCompare = (value) => {
  const ref = useRef();
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
};

export const useDeepCompareEffect = (callback, dependencies) => {
  useEffect(callback, deepCompare(dependencies));
};
