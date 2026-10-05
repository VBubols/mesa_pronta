import os
import time
import json
from datetime import datetime
from django.core.management.base import BaseCommand
import paho.mqtt.client as mqtt
from telemetry.models import Device, Sensor, Reading
from telemetry.metric_types import resolve_metric_meta


class MqttSubscriber:
    def __init__(self, host: str, port: int) -> None:
        self._host = host
        self._port = port
        self._topic = "telemetry/+"
        self._client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

    def connect(self, retries: int = 30, delay: float = 2.0) -> None:
        for attempt in range(1, retries + 1):
            try:
                self._client.connect(self._host, self._port)
                break
            except OSError:
                if attempt == retries:
                    raise
                time.sleep(delay)

    def subscribe(self) -> None:
        def on_connect(client, userdata, flags, reason_code, properties):
            print("Connected to MQTT Broker!")
            client.subscribe(self._topic)

        def on_message(client, userdata, msg):
            data = json.loads(msg.payload)
            
            device, _ = Device.objects.get_or_create(
                device_id = data["device_id"],
                defaults={"name": data["device_name"]},
            )
            
            timestamp = datetime.fromisoformat(data["timestamp"])
    
            for metric_key, value in data["readings"].items():
                if not isinstance(value, (int, float)):
                    continue
                
                meta = resolve_metric_meta(metric_key)
                sensor, _ = Sensor.objects.get_or_create(
                    device = device,
                    metric_key = metric_key,
                    defaults={
                        "metric_type": meta["metric_type"],
                        "label": meta["label"],
                        "unit": meta["unit"],
                        },
                )
    
                Reading.objects.create(
                    sensor = sensor,
                    timestamp = timestamp,
                    value = value
                )
    
            print(f"Gravado {device.name} - {len(data['readings'])} métricas")

        self._client.on_connect = on_connect
        self._client.on_message = on_message

    def run(self) -> None:
        self.subscribe()
        self.connect()
        self._client.loop_forever()


class Command(BaseCommand):
    def handle(self, **options):
        host = os.getenv("MQTT_HOST", "localhost")
        port = int(os.getenv("MQTT_PORT", "1883"))
        subscriber = MqttSubscriber(host, port)
        subscriber.run()