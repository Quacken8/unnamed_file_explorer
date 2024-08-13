import {
  AwaitedSignal,
  AwaitedSignalResult,
  Signal,
  WritableSignal,
} from "@mod.js/signals";
import { useState, useEffect } from "react";

export function useSignal<T>(signal: Signal<T>) {
  const [value, setValue] = useState<T>(signal.get());

  useEffect(() => {
    const unsubscribe = signal.subscribe((v) => {
      setValue(v);
    });
    return () => {
      unsubscribe();
    };
  }, [signal]);

  return value;
}

export function useWritableSignal<T>(signal: WritableSignal<T>) {
  const [value, setValue] = useState<T>(signal.get());

  useEffect(() => {
    const unsubscribe = signal.subscribe((v) => {
      setValue(v);
    });
    return () => {
      unsubscribe();
    };
  }, [signal]);

  const setSignalValue = (v: T) => {
    signal.set(v);
  };

  return [value, setSignalValue] as const;
}

export function useAwaited<T>(signal: AwaitedSignal<T>) {
  const [value, setState] = useState<AwaitedSignalResult<T>>(signal.get());

  useEffect(() => {
    const unsubscribe = signal.subscribe((v) => {
      setState(v);
    });
    return () => {
      unsubscribe();
    };
  }, [signal]);

  return value;
}
