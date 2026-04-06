from .config import Settings
from .pipeline import run_pipeline


def main() -> None:
    settings = Settings.from_env()
    run_pipeline(settings)


if __name__ == "__main__":
    main()