const { IsString } = require("class-validator");
const { plainToInstance } = require("class-transformer");

class PermissionDeleteDto {
  @IsString()
  code;
}

function validateDeleteDto(params) {
  const dto = plainToInstance(PermissionDeleteDto, params);
  const { validateSync } = require("class-validator");
  const errors = validateSync(dto, { whitelist: true });
  if (errors.length > 0) {
    throw new Error("Validation failed: " + JSON.stringify(errors));
  }
  return dto;
}

module.exports = { PermissionDeleteDto, validateDeleteDto };
