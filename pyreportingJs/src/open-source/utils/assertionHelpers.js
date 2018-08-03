/**
 * Helper method to compare two arrays of floating point numbers
 * @param values1 {Array}
 * @param values2 {Array}
 * @param tolerance {Number}
 */
export const expectArraysToBeAlmostEqual = (values1, values2, tolerance = 0.001) => {
  expect(values1.length).toEqual(values2.length);

  const edgeCases = [Infinity, -Infinity, NaN, undefined];
  for (const [index, value] of Object.entries(values1)) {
    const value2 = values2[index];
    if (edgeCases.includes(value) || edgeCases.includes(value2)) {
      // NaN, undefined, can be compared for equality with expect()
      expect(value).toEqual(value2);
    } else {
      expect(value).toBeCloseTo(value2, tolerance);
    }
  }
};

/**
 * Compare two Map objects and ensure their keys are in the same order and that their values are almost equal
 * @param map1 {Map}
 * @param map2 {Map}
 * @param tolerance {Number}
 */
export const expectMapsToBeAlmostEqual = (map1, map2, tolerance = 0.001) => {
  expect(map1.size).toEqual(map2.size);
  const iterator1 = map1.entries();
  const iterator2 = map2.entries();
  let done = false;
  while (!done) {
    const seq1 = iterator1.next(); // example value -- { value: [ 1483401600000, 2257.83 ], done: false }
    const seq2 = iterator2.next();
    done = seq1.done || seq2.done;

    if (!done) {
      const [key1, value1] = seq1.value;
      const [key2, value2] = seq2.value;
      expect(key1).toEqual(key2);
      expect(value1).toBeCloseTo(value2, tolerance);
    }
  }
};


export const expectObjectsToBeAlmostEqual = (obj1, obj2, tolerance = 0.001) => {
  for (const [key, expectedValue] of Object.entries(obj2)) {
    const actualValue = obj1[key];
    if ([Infinity, -Infinity, NaN].includes(actualValue)) {
      expect(actualValue).toEqual(expectedValue);
    } else {
      expect(actualValue).toBeCloseTo(expectedValue, tolerance);
    }
  }
};
