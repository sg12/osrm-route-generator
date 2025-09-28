-- Bus profile for OSRM, adapted for Siberian routes
-- Based on standard car.lua, customized for buses in Siberia (lower speeds, larger vehicle, bus access)

api_version = 4

Set = require('lib/set')
Sequence = require('lib/sequence')
Handlers = require("lib/way_handlers")
Relations = require("lib/relations")
Obstacles = require("lib/obstacles")
find_access_tag = require("lib/access").find_access_tag
limit = require("lib/maxspeed").limit
Utils = require("lib/utils")
Measure = require("lib/measure")

function setup()
  return {
    properties = {
      max_speed_for_map_matching = 100 / 3.6,  -- 100 km/h -> m/s for buses
      weight_name = 'duration',  -- Route by time, not distance
      process_call_tagless_node = false,
      u_turn_penalty = 30,  -- Higher for buses
      continue_straight_at_waypoint = true,
      use_turn_restrictions = true,
      left_hand_driving = false,
    },
    default_mode = mode.driving,
    default_speed = 20,  -- Slower default for buses
    oneway_handling = true,
    side_road_multiplier = 0.7,  -- Penalize side roads more
    turn_penalty = 10,  -- Higher turns
    speed_reduction = 0.7,  -- Slower on bad surfaces
    turn_bias = 1.1,  -- Slight bias against left turns
    cardinal_directions = false,

    -- Bus dimensions (larger than car)
    vehicle_height = 3.5,  -- Meters, for double-deckers or high buses
    vehicle_width = 2.5,   -- Meters
    vehicle_length = 12.0, -- Meters, for standard bus
    vehicle_weight = 15000, -- Kg

    suffix_list = {
      'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'North', 'South', 'West', 'East', 'Nor', 'Sou', 'We', 'Ea'
    },

    barrier_whitelist = Set {
      'cattle_grid',
      'border_control',
      'toll_booth',
      'sally_port',
      'gate',
      'lift_gate',
      'no',
      'entrance',
      'height_restrictor',
      'arch',
      'bus_gate'  -- Allow bus gates
    },

    -- Bus-specific access: allow bus, psv, hov
    access_tag_whitelist = Set {
      'yes',
      'bus',
      'psv',  -- Public service vehicle
      'motorcar',
      'motor_vehicle',
      'vehicle',
      'permissive',
      'designated',
      'hov'
    },

    access_tag_blacklist = Set {
      'no',
      'agricultural',
      'forestry',
      'emergency',
      'customers',
      'private',
      'delivery',
      'destination'
    },

    service_access_tag_blacklist = Set {
      'private'
    },

    restricted_access_tag_list = Set {
      'private',
      'delivery',
      'destination',
      'customers',
    },

    access_tags_hierarchy = Sequence {
      'bus',      -- Bus first
      'psv',
      'motorcar',
      'motor_vehicle',
      'vehicle',
      'access'
    },

    service_tag_forbidden = Set {
      'emergency_access'
    },

    restrictions = Sequence {
      'bus',
      'psv',
      'motorcar',
      'motor_vehicle',
      'vehicle'
    },

    classes = Sequence {
      'toll', 'motorway', 'ferry', 'restricted', 'tunnel', 'busway'  -- Add busway
    },

    excludable = Sequence {
      Set {'toll'},
      Set {'motorway'},
      Set {'ferry'}
    },

    avoid = Set {
      'area',
      'reversible',
      'impassable',
      'steps',  -- Buses can't do steps
      'construction',
      'proposed',
      'narrow'  -- Too narrow for buses
    },

    -- Speeds for buses (lower, Siberia-adjusted: -10-20% for weather/rural)
    speeds = Sequence {
      highway = {
        motorway = 90,     -- Reduced from 130
        motorway_link = 40,
        trunk = 80,        -- Reduced
        trunk_link = 35,
        primary = 70,
        primary_link = 30,
        secondary = 50,
        secondary_link = 25,
        tertiary = 40,
        tertiary_link = 20,
        unclassified = 30,
        residential = 25,
        living_street = 15,
        service = 20
      }
    },

    -- Higher penalties for service roads
    service_penalties = {
      alley = 1.0,
      parking = 0.8,
      parking_aisle = 0.8,
      driveway = 1.0,
      ["drive-through"] = 0.8,
      ["drive-thru"] = 0.8
    },

    restricted_highway_whitelist = Set {
      'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link',
      'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'residential',
      'living_street', 'unclassified', 'service', 'busway'
    },

    construction_whitelist = Set {
      'no', 'widening', 'minor',
    },

    route_speeds = {
      ferry = 5,
      shuttle_train = 10
    },

    bridge_speeds = {
      movable = 5
    },

    -- Surface speeds (harsh penalties for gravel/dirt in Siberia)
    surface_speeds = {
      asphalt = nil,
      concrete = nil,
      ["concrete:plates"] = nil,
      ["concrete:lanes"] = nil,
      paved = nil,

      cement = 70,
      compacted = 60,
      fine_gravel = 50,  -- Penalize gravel

      paving_stones = 50,
      metal = 50,
      bricks = 50,

      grass = 30,
      wood = 30,
      sett = 30,
      grass_paver = 30,
      gravel = 30,  -- Low for Siberia rural
      unpaved = 25,
      ground = 20,
      dirt = 20,
      pebblestone = 20,
      tartan = 20,

      cobblestone = 25,
      clay = 25,

      earth = 15,
      stone = 15,
      rocky = 15,
      sand = 15,

      mud = 5
    },

    -- Tracktype speeds (rural Siberia: penalize bad tracks)
    tracktype_speeds = {
      grade1 = 50,
      grade2 = 30,
      grade3 = 20,  -- Penalize
      grade4 = 15,
      grade5 = 10
    },

    smoothness_speeds = {
      intermediate = 70,
      bad = 30,
      very_bad = 15,
      horrible = 10,
      very_horrible = 5,
      impassable = 0
    },

    -- Maxspeed table (Russia/Siberia focus)
    maxspeed_table_default = {
      urban = 60,    -- Higher urban for buses?
      rural = 80,    -- Reduced rural
      trunk = 100,
      motorway = 110
    },

    maxspeed_table = {
      ["ru:living_street"] = 20,
      ["ru:urban"] = 60,
      ["ru:rural"] = 80,
      ["ru:motorway"] = 110,
      ["ru:trunk"] = 100,
      -- Add Siberia specifics if needed, e.g., winter limits
      ["none"] = 100  -- Cap at 100 for buses
    },

    relation_types = Sequence {
      "route"
    },

    highway_turn_classification = {},

    access_turn_classification = {}
  }
end

-- process_node, process_way, process_turn remain mostly the same as in car.lua
-- (copy from your provided code, but add bus-specific obstacles, e.g., check for bus_bay)

function process_node(profile, node, result, relations)
  local access = find_access_tag(node, profile.access_tags_hierarchy)
  if access then
    if profile.access_tag_blacklist[access] and not profile.restricted_access_tag_list[access] then
      obstacle_map:add(node, Obstacle.new(obstacle_type.barrier))
    end
  else
    local barrier = node:get_value_by_key("barrier")
    if barrier then
      local restricted_by_height = false
      if barrier == 'height_restrictor' then
        local maxheight = Measure.get_max_height(node:get_value_by_key("maxheight"), node)
        restricted_by_height = maxheight and maxheight < profile.vehicle_height
      end

      local bollard = node:get_value_by_key("bollard")
      local rising_bollard = bollard and "rising" == bollard

      local kerb = node:get_value_by_key("kerb")
      local highway = node:get_value_by_key("highway")
      local flat_kerb = kerb and ("lowered" == kerb or "flush" == kerb)
      local highway_crossing_kerb = barrier == "kerb" and highway and highway == "crossing"

      -- Bus-specific: allow bus_stop, bus_bay
      if barrier == 'bus_stop' or barrier == 'bus_bay' then
        goto skip_barrier  -- Ignore as not obstacle
      end

      if not profile.barrier_whitelist[barrier]
        and not rising_bollard
        and not flat_kerb
        and not highway_crossing_kerb
        or restricted_by_height then
        obstacle_map:add(node, Obstacle.new(obstacle_type.barrier))
      end
      ::skip_barrier::
    end
  end
  Obstacles.process_node(profile, node)
end

-- process_way: copy from your car.lua, but add busway handling
function process_way(profile, way, result, relations)
  local data = {
    highway = way:get_value_by_key('highway'),
    bridge = way:get_value_by_key('bridge'),
    route = way:get_value_by_key('route'),
    busway = way:get_value_by_key('busway')  -- Bus lane check
  }

  if (not data.highway or data.highway == '') and
     (not data.route or data.route == '')
  then
    return
  end

  handlers = Sequence {
    WayHandlers.default_mode,
    WayHandlers.blocked_ways,
    WayHandlers.avoid_ways,
    WayHandlers.handle_height,
    WayHandlers.handle_width,
    WayHandlers.handle_length,
    WayHandlers.handle_weight,
    WayHandlers.access,
    WayHandlers.oneway,
    WayHandlers.destinations,
    WayHandlers.ferries,
    WayHandlers.movables,
    WayHandlers.service,
    WayHandlers.hov,
    -- Bus-specific: prioritize busway
    function() 
      if data.busway and data.busway ~= 'no' then
        result.mode = mode.driving
        result.speed = math.max(result.speed or 50, 60)  -- Boost on bus lanes
      end
    end,
    WayHandlers.speed,
    WayHandlers.maxspeed,
    WayHandlers.surface,
    WayHandlers.penalties,
    WayHandlers.classes,
    WayHandlers.turn_lanes,
    WayHandlers.classification,
    WayHandlers.roundabouts,
    WayHandlers.startpoint,
    WayHandlers.driving_side,
    WayHandlers.names,
    WayHandlers.weights,
    WayHandlers.way_classification_for_turn
  }

  WayHandlers.run(profile, way, result, data, handlers, relations)

  if profile.cardinal_directions then
    Relations.process_way_refs(way, relations, result)
  end
end

-- process_turn: copy from car.lua, but higher u_turn_penalty
function process_turn(profile, turn)
  local turn_penalty = profile.turn_penalty
  local turn_bias = turn.is_left_hand_driving and 1. / profile.turn_bias or profile.turn_bias

  for _, obs in pairs(obstacle_map:get(turn.from, turn.via)) do
    if obs.type == obstacle_type.stop_minor and not Obstacles.entering_by_minor_road(turn) then
      goto skip
    end
    if turn.number_of_roads == 2
      and obs.type == obstacle_type.stop
      and obs.direction == obstacle_direction.none
      and turn.source_road.distance < 20
      and turn.target_road.distance > 20 then
      goto skip
    end
    turn.duration = turn.duration + obs.duration
    ::skip::
  end

  if turn.number_of_roads > 2 or turn.source_mode ~= turn.target_mode or turn.is_u_turn then
    if turn.angle >= 0 then
      turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 / turn_bias) * turn.angle/180 - 6.5*turn_bias)))
    else
      turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 * turn_bias) * -turn.angle/180 - 6.5/turn_bias)))
    end
    if turn.is_u_turn then
      turn.duration = turn.duration + profile.properties.u_turn_penalty
    end
  end

  turn.weight = turn.duration  -- For duration-based

  if profile.properties.weight_name == 'routability' then
    if not turn.source_restricted and turn.target_restricted then
      turn.weight = constants.max_turn_weight
    end
  end
end

return {
  setup = setup,
  process_way = process_way,
  process_node = process_node,
  process_turn = process_turn
}