// AsyncStorage has no native module under Jest; its official in-memory mock stands in.
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
