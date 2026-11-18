"""Navigation Stack Abstraction Interface for MediBot KP.
Designed to mirror ROS 2 Navigation2 action interfaces (NavigateToPose, FollowPath, ComputePathToPose).
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Tuple


class INavigationService(ABC):
    @abstractmethod
    def navigate_to_pose(self, target_x: float, target_z: float, target_theta: Optional[float] = None) -> bool:
        """Command navigation to designated target pose (equivalent to Nav2 NavigateToPose)."""
        pass

    @abstractmethod
    def cancel_navigation(self) -> None:
        """Cancel active navigation goal."""
        pass

    @abstractmethod
    def pause_navigation(self) -> None:
        """Pause active trajectory."""
        pass

    @abstractmethod
    def resume_navigation(self) -> None:
        """Resume active trajectory."""
        pass

    @abstractmethod
    def get_current_path(self) -> List[Dict[str, float]]:
        """Get currently planned path waypoints."""
        pass
