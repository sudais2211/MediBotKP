"""Asynchronous Event Bus for Internal Simulation Notifications in MediBot KP."""
import asyncio
from typing import Callable, Dict, List, Any


class EventBus:
    def __init__(self):
        self._listeners: Dict[str, List[Callable[[Any], None]]] = {}

    def subscribe(self, event_type: str, callback: Callable[[Any], None]):
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(callback)

    def publish(self, event_type: str, payload: Any):
        if event_type in self._listeners:
            for callback in self._listeners[event_type]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        asyncio.create_task(callback(payload))
                    else:
                        callback(payload)
                except Exception as e:
                    print(f"Error in event listener for {event_type}: {e}")


event_bus = EventBus()
