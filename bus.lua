-- Bus profile for OSRM, adapted from car.lua for Siberian buses
-- Simplified: No custom handlers to avoid Lua errors; busway via access/speeds

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
      max_speed_for_map_matching      = 100/3.6, -- 100kmph -> m/s (slower for buses)
      weight_name                     = 'duration',  -- Route by time
      process_call_tagless_node      = false,
      u_turn_penalty                 = 30,  -- Higher for buses
      continue_straight_at_waypoint  = true,
      use_turn_restrictions          = true,
      left_hand_driving              = false,
    },
    default_mode              = mode.driving,
    default_speed             = 20,  -- Slower default for buses
    oneway_handling           = true,
    side_road_multiplier      = 0.7,  -- Penalize side roads more
    turn_penalty              = 10,  -- Higher turns
    speed_reduction           = 0.7,  -- Slower on bad surfaces
    turn_bias                 = 1.1,  -- Bias against left turns
    cardinal_directions       = false,
    -- Bus sizes (larger)
    vehicle_height = 3.5,  -- Meters
    vehicle_width = 2.5,   -- Meters
    vehicle_length = 12.0, -- Meters
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
      'bus_gate'  -- Bus-specific
    },
    access_tag_whitelist = Set {
      'yes',
      'bus',  -- Bus priority
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
    -- tags disallow access to in combination with highway=service
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
      'bus',  -- Bus first
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
        'toll', 'motorway', 'ferry', 'restricted', 'tunnel', 'busway'  -- Add busway class
    },
    -- classes to support for exclude flags
    excludable = Sequence {
        Set {'toll'},
        Set {'motorway'},
        Set {'ferry'}
    },
    avoid = Set {
      'area',
      'reversible',
      'impassable',
      'hov_lanes',
      'steps',  -- Buses avoid steps
      'construction',
      'proposed',
      'narrow'  -- Too narrow for buses
    },
    speeds = Sequence {
      highway = {
        motorway        = 90,  -- Reduced for buses/Siberia
        motorway_link   = 40,
        trunk           = 80,
        trunk_link      = 35,
        primary         = 70,
        primary_link    = 30,
        secondary       = 50,
        secondary_link  = 25,
        tertiary        = 40,
        tertiary_link   = 20,
        unclassified    = 30,
        residential     = 25,
        living_street   = 15,
        service         = 20
      }
    },
    service_penalties = {
      alley             = 1.0,
      parking           = 0.8,
      parking_aisle     = 0.8,
      driveway          = 1.0,
      ["drive-through"] = 0.8,
      ["drive-thru"] = 0.8
    },
    restricted_highway_whitelist = Set {
      'motorway',
      'motorway_link',
      'trunk',
      'trunk_link',
      'primary',
      'primary_link',
      'secondary',
      'secondary_link',
      'tertiary',
      'tertiary_link',
      'residential',
      'living_street',
      'unclassified',
      'service',
      'busway'  -- Allow busways
    },
    construction_whitelist = Set {
      'no',
      'widening',
      'minor',
    },
    route_speeds = {
      ferry = 5,
      shuttle_train = 10
    },
    bridge_speeds = {
      movable = 5
    },
    -- surface/tracktype/smoothness (penalties for Siberia gravel/dirt)
    surface_speeds = {
      asphalt = nil,
      concrete = nil,
      ["concrete:plates"] = nil,
      ["concrete:lanes"] = nil,
      paved = nil,
      cement = 70,
      compacted = 60,
      fine_gravel = 50,
      paving_stones = 50,
      metal = 50,
      bricks = 50,
      grass = 30,
      wood = 30,
      sett = 30,
      grass_paver = 30,
      gravel = 30,  -- Low for rural Siberia
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
    tracktype_speeds = {
      grade1 = 50,
      grade2 = 30,
      grade3 = 20,
      grade4 = 15,
      grade5 = 10
    },
    smoothness_speeds = {
      intermediate    = 70,
      bad             = 30,
      very_bad        = 15,
      horrible        = 10,
      very_horrible   = 5,
      impassable      = 0
    },
    -- http://wiki.openstreetmap.org/wiki/Speed_limits (RU/Siberia focus)
    maxspeed_table_default = {
      urban = 60,
      rural = 80,
      trunk = 100,
      motorway = 110
    },
    maxspeed_table = {
      ["ru:living_street"] = 20,
      ["ru:urban"] = 60,
      ["ru:rural"] = 80,
      ["ru:motorway"] = 110,
      ["ru:trunk"] = 100,
      ["none"] = 100
    },
    relation_types = Sequence {
      "route"
    },
    highway_turn_classification = {},
    access_turn_classification = {}
  }
end

-- Use standard process functions from car.lua (no custom changes to avoid errors)
function process_node(profile, node, result, relations)
  -- parse access and barrier tags
  local access = find_access_tag(node, profile.access_tags_hierarchy)
  if access then
    if profile.access_tag_blacklist[access] and not profile.restricted_access_tag_list[access] then
      obstacle_map:add(node, Obstacle.new(obstacle_type.barrier))
    end
  else
    local barrier = node:get_value_by_key("barrier")
    if barrier then
      --  check height restriction barriers
      local restricted_by_height = false
      if barrier == 'height_restrictor' then
         local maxheight = Measure.get_max_height(node:get_value_by_key("maxheight"), node)
         restricted_by_height = maxheight and maxheight < profile.vehicle_height
      end
      --  make an exception for rising bollard barriers
      local bollard = node:get_value_by_key("bollard")
      local rising_bollard = bollard and "rising" == bollard
      -- make an exception for lowered/flat barrier=kerb
      -- and incorrect tagging of highway crossing kerb as highway barrier
      local kerb = node:get_value_by_key("kerb")
      local highway = node:get_value_by_key("highway")
      local flat_kerb = kerb and ("lowered" == kerb or "flush" == kerb)
      local highway_crossing_kerb = barrier == "kerb" and highway and highway == "crossing"
      if not profile.barrier_whitelist[barrier]
            and not rising_bollard
            and not flat_kerb
            and not highway_crossing_kerb
            or restricted_by_height then
        obstacle_map:add(node, Obstacle.new(obstacle_type.barrier))
      end
    end
  end
  Obstacles.process_node(profile, node)
end

function process_way(profile, way, result, relations)
  -- the intial filtering of ways based on presence of tags
  -- affects processing times significantly, because all ways
  -- have to be checked.
  -- to increase performance, prefetching and intial tag check
  -- is done in directly instead of via a handler.
  -- in general we should  try to abort as soon as
  -- possible if the way is not routable, to avoid doing
  -- unnecessary work. this implies we should check things that
  -- commonly forbids access early, and handle edge cases later.
  -- data table for storing intermediate values during processing
  local data = {
    -- prefetch tags
    highway = way:get_value_by_key('highway'),
    bridge = way:get_value_by_key('bridge'),
    route = way:get_value_by_key('route')
  }
  -- perform an quick initial check and abort if the way is
  -- obviously not routable.
  -- highway or route tags must be in data table, bridge is optional
  if (not data.highway or data.highway == '') and
  (not data.route or data.route == '')
  then
    return
  end
  handlers = Sequence {
    -- set the default mode for this profile. if can be changed later
    -- in case it turns we're e.g. on a ferry
    WayHandlers.default_mode,
    -- check various tags that could indicate that the way is not
    -- routable. this includes things like status=impassable,
    -- toll=yes and oneway=reversible
    WayHandlers.blocked_ways,
    WayHandlers.avoid_ways,
    WayHandlers.handle_height,
    WayHandlers.handle_width,
    WayHandlers.handle_length,
    WayHandlers.handle_weight,
    -- determine access status by checking our hierarchy of
    -- access tags, e.g: motorcar, motor_vehicle, vehicle
    WayHandlers.access,
    -- check whether forward/backward directions are routable
    WayHandlers.oneway,
    -- check a road's destination
    WayHandlers.destinations,
    -- check whether we're using a special transport mode
    WayHandlers.ferries,
    WayHandlers.movables,
    -- handle service road restrictions
    WayHandlers.service,
    -- handle hov
    WayHandlers.hov,
    -- compute speed taking into account way type, maxspeed tags, etc.
    WayHandlers.speed,
    WayHandlers.maxspeed,
    WayHandlers.surface,
    WayHandlers.penalties,
    -- compute class labels
    WayHandlers.classes,
    -- handle turn lanes and road classification, used for guidance
    WayHandlers.turn_lanes,
    WayHandlers.classification,
    -- handle various other flags
    WayHandlers.roundabouts,
    WayHandlers.startpoint,
    WayHandlers.driving_side,
    -- set name, ref and pronunciation
    WayHandlers.names,
    -- set weight properties of the way
    WayHandlers.weights,
    -- set classification of ways relevant for turns
    WayHandlers.way_classification_for_turn
  }
  WayHandlers.run(profile, way, result, data, handlers, relations)
  if profile.cardinal_directions then
      Relations.process_way_refs(way, relations, result)
  end
end

function process_turn(profile, turn)
  -- Use a sigmoid function to return a penalty that maxes out at turn_penalty
  -- over the space of 0-180 degrees.  Values here were chosen by fitting
  -- the function to some turn penalty samples from real driving.
  local turn_penalty = profile.turn_penalty
  local turn_bias = turn.is_left_hand_driving and 1. / profile.turn_bias or profile.turn_bias
  for _, obs in pairs(obstacle_map:get(turn.from, turn.via)) do
    -- disregard a minor stop if entering by the major road
    -- rationale: if a stop sign is tagged at the center of the intersection with stop=minor
    -- it should only penalize the minor roads entering the intersection
    if obs.type == obstacle_type.stop_minor and not Obstacles.entering_by_minor_road(turn) then
        goto skip
    end
    -- heuristic to infer the direction of a stop without an explicit direction tag
    -- rationale: a stop sign should not be placed farther than 20m from the intersection
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
      turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 / turn_bias) *  turn.angle/180 - 6.5*turn_bias)))
    else
      turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 * turn_bias) * -turn.angle/180 - 6.5/turn_bias)))
    end
    if turn.is_u_turn then
      turn.duration = turn.duration + profile.properties.u_turn_penalty
    end
  end
  -- for distance based routing we don't want to have penalties based on turn angle
  if profile.properties.weight_name == 'distance' then
     turn.weight = 0
  else
     turn.weight = turn.duration
  end
  if profile.properties.weight_name == 'routability' then
      -- penalize turns from non-local access only segments onto local access only tags
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